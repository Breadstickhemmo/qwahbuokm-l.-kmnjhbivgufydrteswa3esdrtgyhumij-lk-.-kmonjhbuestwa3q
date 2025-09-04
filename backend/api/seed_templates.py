import click
from flask.cli import with_appcontext
from .extensions import db
from .models import Presentation, Slide, SlideElement, User

TEMPLATES_DATA = [
    {
        "title": "Шаблон 'Темная тема'",
        "slides": [
            # Слайд 1: Титульный
            {
                "background_image": "/static/templates/backgrounds/dark_template_bg1.png",
                "elements": [
                    {"type": "TEXT", "content": "Заголовок", "x": 100, "y": 280, "w": 600, "h": 100, "size": 60},
                    {"type": "TEXT", "content": "примерно о чем будет презентация", "x": 100, "y": 390, "w": 600, "h": 120, "size": 28},
                ]
            },
            # Слайд 2: Теорема
            {
                "background_image": "/static/templates/backgrounds/dark_template_bg2.png",
                "elements": [
                    {"type": "TEXT", "content": "Теорема", "x": 100, "y": 90, "w": 1080, "h": 80, "size": 54},
                    {"type": "TEXT", "content": "текст текст текст текст текст текст текст текст текст текст текст текст", "x": 100, "y": 200, "w": 1080, "h": 150, "size": 24},
                    {"type": "TEXT", "content": "Формула", "x": 100, "y": 420, "w": 1080, "h": 220, "size": 32},
                ]
            },
            # Слайд 3: Текст и Изображение
            {
                "background_image": "/static/templates/backgrounds/dark_template_bg3.png",
                "elements": [
                    {"type": "TEXT", "content": "Заголовок", "x": 100, "y": 60, "w": 1100, "h": 80, "size": 54},
                    {"type": "TEXT", "content": "Подзаголовок", "x": 120, "y": 200, "w": 480, "h": 60, "size": 32},
                    {"type": "TEXT", "content": "текст текст текст текст текст текст текст текст текст текст", "x": 120, "y": 280, "w": 480, "h": 300, "size": 22},
                    {"type": "IMAGE", "content": None, "x": 680, "y": 180, "w": 500, "h": 420},
                ]
            },
            # Слайд 4: Четыре колонки
            {
                "background_image": "/static/templates/backgrounds/dark_template_bg4.png",
                "elements": [
                    {"type": "TEXT", "content": "Заголовок", "x": 100, "y": 60, "w": 1100, "h": 80, "size": 54},
                    # Колонка 1
                    {"type": "TEXT", "content": "01", "x": 120, "y": 200, "w": 250, "h": 60, "size": 36},
                    {"type": "TEXT", "content": "текст текст текст текст текст текст текст текст", "x": 120, "y": 270, "w": 250, "h": 300, "size": 18},
                    # Колонка 2 (с картинкой)
                    {"type": "IMAGE", "content": None, "x": 400, "y": 200, "w": 250, "h": 370},
                    # Колонка 3
                    {"type": "TEXT", "content": "02", "x": 680, "y": 200, "w": 250, "h": 60, "size": 36},
                    {"type": "TEXT", "content": "текст текст текст текст текст текст текст текст", "x": 680, "y": 270, "w": 250, "h": 300, "size": 18},
                    # Колонка 4 (с картинкой)
                    {"type": "IMAGE", "content": None, "x": 960, "y": 200, "w": 250, "h": 370},
                ]
            },
            # Слайд 5: Видео
            {
                "background_image": "/static/templates/backgrounds/dark_template_bg5.png",
                "elements": [
                    {"type": "TEXT", "content": "Заголовок", "x": 100, "y": 120, "w": 600, "h": 80, "size": 54},
                    {"type": "UPLOADED_VIDEO", "content": None, "x": 100, "y": 240, "w": 700, "h": 394}, # 16:9
                ]
            }
        ]
    },
]

@click.command(name='seed-templates')
@with_appcontext
def seed_templates():
    admin_user = User.query.first()
    if not admin_user:
        print("Не найден пользователь. Пожалуйста, создайте хотя бы одного пользователя перед запуском сидера.")
        return

    print("Удаление старых шаблонов...")
    Presentation.query.filter_by(is_template=True).delete()
    db.session.commit()
    print("Старые шаблоны удалены.")

    print("Создание новых шаблонов...")
    for template_data in TEMPLATES_DATA:
        template_presentation = Presentation(
            title=template_data["title"],
            user_id=admin_user.id,
            is_template=True
        )
        db.session.add(template_presentation)
        db.session.flush()

        for i, slide_data in enumerate(template_data["slides"]):
            template_slide = Slide(
                slide_number=i + 1,
                presentation_id=template_presentation.id,
                background_image=slide_data.get("background_image")
            )
            db.session.add(template_slide)
            db.session.flush()

            for element_data in slide_data["elements"]:
                template_element = SlideElement(
                    slide_id=template_slide.id,
                    element_type=element_data["type"],
                    content=element_data.get("content"),
                    pos_x=element_data.get("x", 100),
                    pos_y=element_data.get("y", 100),
                    width=element_data.get("w", 400),
                    height=element_data.get("h", 150),
                    font_size=element_data.get("size", 24)
                )
                db.session.add(template_element)
    
    db.session.commit()
    print(f"Успешно создано {len(TEMPLATES_DATA)} шаблонов.")

def init_app(app):
    app.cli.add_command(seed_templates)