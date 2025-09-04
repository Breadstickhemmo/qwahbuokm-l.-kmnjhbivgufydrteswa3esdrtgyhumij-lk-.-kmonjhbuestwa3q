from flask import request, jsonify, Blueprint, current_app, g
from gigachat import GigaChat
import ssl
import requests
import time
import json
import base64
import os
from ..models import Presentation, Slide, SlideElement
from ..extensions import db
from .presentations import token_required

ai_bp = Blueprint('ai', __name__)

class FusionBrainAPI:

    def __init__(self, url: str, api_key: str, secret_key: str):
        self.URL = url
        self.AUTH_HEADERS = {
            'X-Key': f'Key {api_key}',
            'X-Secret': f'Secret {secret_key}',
        }

    def get_pipeline(self) -> str:
        response = requests.get(self.URL + 'key/api/v1/pipelines', headers=self.AUTH_HEADERS, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data[0]['id']

    def generate(self, prompt: str, pipeline: str, images: int = 1, width: int = 1024, height: int = 1024) -> str:
        params = {
            "type": "GENERATE",
            "numImages": images,
            "width": width,
            "height": height,
            "generateParams": {
                "query": prompt
            }
        }

        data = {
            'pipeline_id': (None, pipeline),
            'params': (None, json.dumps(params), 'application/json')
        }
        response = requests.post(self.URL + 'key/api/v1/pipeline/run', headers=self.AUTH_HEADERS, files=data, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data['uuid']

    def check_generation(self, request_id: str, attempts: int = 30, delay: int = 10):
        while attempts > 0:
            try:
                response = requests.get(self.URL + 'key/api/v1/pipeline/status/' + request_id, 
                                      headers=self.AUTH_HEADERS, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                if data['status'] == 'DONE':
                    if 'images' in data:
                        return data['images']
                    elif 'result' in data and 'images' in data['result']:
                        return data['result']['images']
                    elif 'result' in data and 'files' in data['result']:
                        return data['result']['files']
                    return None
                
                elif data['status'] == 'FAIL':
                    return None

                attempts -= 1
                time.sleep(delay)
                
            except Exception:
                attempts -= 1
                time.sleep(delay)
        
        return None

    def save_image(self, image_data: str, filename: str = "generated_image"):
        """Сохраняет изображение из base64"""
        if not filename.endswith('.jpg'):
            filename += '.jpg'
        
        try:
            image_bytes = base64.b64decode(image_data)
            with open(filename, 'wb') as f:
                f.write(image_bytes)
            return filename
        except Exception as e:
            print(f"❌ Ошибка при сохранении изображения: {e}")
            return None


def upload_to_telegram(image_path, bot_token, chat_id):
    """
    Загружает изображение в Telegram и возвращает прямую ссылку
    
    Args:
        image_path (str): Путь к файлу изображения
        bot_token (str): Токен вашего Telegram бота
        chat_id (str/int): ID чата для отправки
    
    Returns:
        str: Прямая ссылка на изображение
    """
    url = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
    
    try:
        with open(image_path, "rb") as image_file:
            files = {"photo": image_file}
            data = {"chat_id": chat_id}
            response = requests.post(url, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            file_id = response.json()['result']['photo'][-1]['file_id']
            file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile"
            file_info_response = requests.post(file_info_url, data={"file_id": file_id})
            
            if file_info_response.status_code == 200:
                file_path = file_info_response.json()['result']['file_path']
                return f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
            else:
                print("❌ Не удалось получить информацию о файле")
                return None
        else:
            print(f"❌ Ошибка загрузки в Telegram: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при загрузке в Telegram: {e}")
        return None


def generate_image_url(prompt: str):
    """
    Генерирует изображение по промпту и возвращает публичную ссылку на Telegram
    """
    # Получаем ключи из конфига Flask
    FUSIONBRAIN_API_KEY = current_app.config.get("KANDINSKY_API_KEY")
    FUSIONBRAIN_SECRET_KEY = current_app.config.get("KANDINSKY_SECRET_KEY")
    TELEGRAM_BOT_TOKEN = current_app.config.get("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID = current_app.config.get("TELEGRAM_CHAT_ID")

    if not FUSIONBRAIN_API_KEY or not FUSIONBRAIN_SECRET_KEY:
        print("❌ FusionBrain API keys not configured")
        return None
    
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("❌ Telegram credentials not configured")
        return None
    
    api = FusionBrainAPI(
        'https://api-key.fusionbrain.ai/',
        FUSIONBRAIN_API_KEY,
        FUSIONBRAIN_SECRET_KEY
    )
    
    try:
        # Получаем pipeline
        pipeline_id = api.get_pipeline()
        
        # Запускаем генерацию
        task_id = api.generate(prompt, pipeline_id)
        
        # Ждем завершения генерации
        for attempt in range(20):  # 20 попыток по 5 секунд
            time.sleep(5)
            
            images = api.check_generation(task_id)
            
            if images is not None:
                if images:  # Генерация завершена успешно
                    # Сохраняем изображение временно
                    temp_filename = f"temp_generated_{attempt}.jpg"
                    saved_file = api.save_image(images[0], temp_filename)
                    
                    if saved_file:
                        # Загружаем в Telegram
                        telegram_url = upload_to_telegram(saved_file, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
                        
                        # Удаляем временный файл
                        try:
                            os.remove(saved_file)
                        except:
                            pass
                        
                        if telegram_url:
                            print(f"✅ Изображение сгенерировано и загружено в Telegram: {telegram_url}")
                            return telegram_url
                        else:
                            print(f"❌ Не удалось загрузить изображение в Telegram для промпта: {prompt}")
                            return None
                    else:
                        print(f"❌ Не удалось сохранить изображение для промпта: {prompt}")
                        return None
                else:  # Генерация завершилась ошибкой
                    print(f"❌ Генерация изображения не удалась для промпта: {prompt}")
                    return None
        
        print(f"❌ Таймаут генерации изображения для промпта: {prompt}")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"❌ HTTP ошибка при генерации изображения для промпта '{prompt}': {e}")
        return None
    except Exception as e:
        print(f"❌ Неожиданная ошибка при генерации изображения для промпта '{prompt}': {e}")
        return None


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
                "Запрещаю использовать Markdown разметку. "
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
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'message': 'Произошла критическая внутренняя ошибка сервера'}), 500