import click
from flask.cli import with_appcontext
from .extensions import db
from .models import User, SystemPrompt

@click.command(name='make-admin')
@click.argument('email')
@with_appcontext
def make_admin(email):
    user = User.query.filter_by(email=email).first()
    if user:
        user.is_admin = True
        db.session.commit()
        print(f"Пользователь {email} теперь является администратором.")
    else:
        print(f"Пользователь с email {email} не найден.")

@click.command(name='seed-prompts')
@with_appcontext
def seed_prompts():
    """Заполняет базу данных начальными системными промптами для ИИ."""
    
    DEFAULT_PROMPTS = [
        {
            'name': 'generate_presentation',
            'description': 'Основной промпт для генерации всей структуры презентации с нуля по теме пользователя.',
            'prompt_text': (
                "Ты - профессиональный дизайнер презентаций. Твоя задача — создать структуру для презентации на заданную тему. "
                "Сгенерируй от 4 до 7 слайдов. "
                "Презентация должна иметь логическую структуру: введение, несколько слайдов с основной информацией и заключение. "
                "Для каждого слайда предоставь: 'Название слайда', 'Текст слайда' и 'Картинка слайда' (это должен быть короткий, емкий промпт на русском языке для нейросети, которая будет рисовать изображение). "
                "Ответ должен быть в строгом формате, без лишних слов. Перед каждым слайдом обязательно пиши 'Слайд x'."
                "Запрещаю использовать Markdown разметку."
            )
        },
        {
            'name': 'process_text',
            'description': 'Промпт для обработки текста на слайде (сокращение, улучшение). Использует плейсхолдер {command}.',
            'prompt_text': "Ты — редактор-помощник. Выполни следующую команду для текста: '{command}'. Ответь только измененным текстом, без лишних слов и форматирования."
        },
        {
            'name': 'suggest_image',
            'description': 'Промпт для создания промпта для генерации изображения на основе текста слайда.',
            'prompt_text': (
                "На основе следующего текста со слайда презентации создай короткий, но детальный промпт на русском языке для нейросети, "
                "которая будет рисовать изображение. Промпт должен быть в стиле 'яркая иллюстрация, ...'. "
                "Ответь только самим промптом, без лишних слов."
            )
        }
    ]

    for default_prompt in DEFAULT_PROMPTS:
        existing_prompt = SystemPrompt.query.filter_by(name=default_prompt['name']).first()
        if not existing_prompt:
            new_prompt = SystemPrompt(
                name=default_prompt['name'],
                description=default_prompt['description'],
                prompt_text=default_prompt['prompt_text']
            )
            db.session.add(new_prompt)
            print(f"Добавлен промпт: {default_prompt['name']}")
    
    db.session.commit()
    print("Заполнение промптами завершено.")


def init_app(app):
    app.cli.add_command(make_admin)
    app.cli.add_command(seed_prompts)