from flask import request, jsonify, Blueprint, current_app, g
from gigachat import GigaChat
import ssl
import requests
import time
from ..models import Presentation, Slide, SlideElement
from ..extensions import db
from .presentations import token_required

ai_bp = Blueprint('ai', __name__)

def parse_slides_from_text(input_text):
    slides_data = []
    slide_chunks = input_text.strip().split("Слайд ")
    
    for chunk in slide_chunks:
        if not chunk.strip():
            continue
            
        lines = chunk.strip().split("\n")
        slide_info = {
            'title': '',
            'text': '',
            'image_prompt': ''
        }
        
        for line in lines:
            if ":" in line:
                key, value = line.split(":", 1)
                key = key.strip()
                value = value.strip()
                
                if "Название слайда" in key:
                    slide_info['title'] = value
                elif "Текст слайда" in key:
                    slide_info['text'] = value
                elif "Картинка слайда" in key:
                    slide_info['image_prompt'] = value
        
        if slide_info['title']:
            slides_data.append(slide_info)
            
    return slides_data

def generate_image_url(prompt: str) -> str:
    api_key = current_app.config.get("IMAGE_GEN_API_KEY")
    base_url = "https://api.kie.ai"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    try:
        gen_resp = requests.post(
            f"{base_url}/api/v1/gpt4o-image/generate",
            headers=headers,
            json={"prompt": prompt, "size": "16:9", "quality": "standart", "style": "natural"}
        )
        gen_resp.raise_for_status()
        
        gen_json = gen_resp.json()
        
        task_id = gen_json.get("data", {}).get("taskId")
        if not task_id:
            print(f"Image generation API did not return taskId. Response: {gen_json}")
            return None

        for _ in range(45):
            time.sleep(2)
            status_resp = requests.get(
                f"{base_url}/api/v1/gpt4o-image/record-info",
                headers=headers,
                params={"taskId": task_id}
            )
            status_resp.raise_for_status()
            
            status_json = status_resp.json()
            data = status_json.get("data", {})

            if data.get("successFlag") == 1:
                urls = data.get("response", {}).get("resultUrls", [])
                if urls:
                    return urls[0]
            elif data.get("successFlag") == -1:
                print(f"Image generation failed for prompt: {prompt}. Reason: {data.get('message')}")
                return None
        
        print(f"Image generation timed out for prompt: {prompt}")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"HTTP Error generating image for prompt '{prompt}': {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred in generate_image_url for prompt '{prompt}': {e}")
        return None

@ai_bp.route('/presentations/generate-ai', methods=['POST'])
@token_required
def generate_ai_presentation():
    data = request.get_json()
    user_prompt = data.get('prompt')
    if not user_prompt:
        return jsonify({'message': 'Промпт обязателен'}), 400

    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        with GigaChat(
            credentials=current_app.config.get("GIGACHAT_CREDENTIALS"),
            ssl_context=ssl_context
        ) as giga:
            system_prompt = (
                "Ты - профессиональный дизайнер презентаций. Твоя задача — создать структуру для презентации на заданную тему. "
                "Сгенерируй от 4 до 7 слайдов. "
                "Презентация должна иметь логическую структуру: введение, несколько слайдов с основной информацией и заключение. "
                "Для каждого слайда предоставь: 'Название слайда', 'Текст слайда' и 'Картинка слайда' (это должен быть короткий, емкий промпт на русском языке для нейросети, которая будет рисовать изображение). "
                "Ответ должен быть в строгом формате, без лишних слов. Перед каждым слайдом обязательно пиши 'Слайд x'."
                "Тебе запрещено использовать MarkDown разметку"
            )
            full_prompt = f"{system_prompt}\nТема презентации: {user_prompt}"
            
            response = giga.chat(full_prompt)
            generated_text = response.choices[0].message.content
            print("--- GigaChat Raw Response ---")
            print(generated_text)
            print("-----------------------------")

        slides_content = parse_slides_from_text(generated_text)
        if not slides_content or len(slides_content) < 2:
            print(f"Failed to parse slides or got too few slides. Parsed data: {slides_content}")
            return jsonify({'message': 'Не удалось сгенерировать корректную структуру презентации. Попробуйте другую тему.'}), 500

        new_presentation = Presentation(title=user_prompt, owner=g.current_user)
        db.session.add(new_presentation)
        db.session.flush()

        for i, content in enumerate(slides_content):
            print(f"Processing slide {i+1}. Image prompt: {content['image_prompt']}")
            image_url = generate_image_url(content['image_prompt'])

            new_slide = Slide(slide_number=i + 1, presentation_id=new_presentation.id)
            db.session.add(new_slide)
            db.session.flush()

            title_element = SlideElement(slide_id=new_slide.id, element_type='TEXT', content=content['title'], pos_x=80, pos_y=60, width=1120, height=120, font_size=48)
            db.session.add(title_element)

            if image_url:
                text_element = SlideElement(slide_id=new_slide.id, element_type='TEXT', content=content['text'], pos_x=80, pos_y=200, width=580, height=460, font_size=24)
                image_element = SlideElement(slide_id=new_slide.id, element_type='IMAGE', content=image_url, pos_x=680, pos_y=200, width=520, height=293)
                db.session.add(text_element)
                db.session.add(image_element)
            else:
                print(f"No image generated for slide {i+1}. Using full-width text.")
                text_element = SlideElement(slide_id=new_slide.id, element_type='TEXT', content=content['text'], pos_x=80, pos_y=200, width=1120, height=460, font_size=24)
                db.session.add(text_element)

        db.session.commit()

        return jsonify({'id': new_presentation.id}), 201

    except Exception as e:
        print(f"Critical error during AI presentation generation: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'Произошла критическая внутренняя ошибка сервера'}), 500