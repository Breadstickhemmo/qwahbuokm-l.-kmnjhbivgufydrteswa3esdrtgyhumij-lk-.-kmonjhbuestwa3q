from flask import Blueprint, jsonify, request, current_app, g, url_for
import os
import uuid
from ..models import Presentation, Slide, User, SystemPrompt
from ..extensions import db
from .decorators import token_required, admin_required

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/templates', methods=['GET'])
@token_required
@admin_required
def get_all_templates():
    templates = Presentation.query.filter_by(is_template=True).order_by(Presentation.created_at.desc()).all()
    output = []
    for t in templates:
        output.append({
            'id': t.id,
            'title': t.title,
            'created_at': t.created_at.isoformat(),
            'preview_image': t.preview_image
        })
    return jsonify(output)

@admin_bp.route('/admin/templates', methods=['POST'])
@token_required
@admin_required
def create_template():
    new_template = Presentation(title="Новый шаблон", owner=g.current_user, is_template=True)
    db.session.add(new_template)
    db.session.flush()
    first_slide = Slide(slide_number=1, presentation_id=new_template.id)
    db.session.add(first_slide)
    db.session.commit()
    return jsonify({
        'id': new_template.id,
        'title': new_template.title,
        'created_at': new_template.created_at.isoformat(),
        'preview_image': new_template.preview_image
    }), 201

@admin_bp.route('/admin/templates/<string:template_id>', methods=['PUT'])
@token_required
@admin_required
def update_template(template_id):
    template = Presentation.query.filter_by(id=template_id, is_template=True).first_or_404()
    data = request.get_json()
    if 'title' in data:
        template.title = data['title']
    db.session.commit()
    return jsonify({'message': 'Шаблон обновлен'}), 200

@admin_bp.route('/admin/templates/<string:template_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_template(template_id):
    template = Presentation.query.filter_by(id=template_id, is_template=True).first_or_404()
    db.session.delete(template)
    db.session.commit()
    return jsonify({'message': 'Шаблон успешно удален'}), 200

@admin_bp.route('/admin/templates/<string:template_id>/upload-preview', methods=['POST'])
@token_required
@admin_required
def upload_template_preview(template_id):
    if 'file' not in request.files:
        return jsonify({'message': 'Файл не найден в теле запроса'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'message': 'Файл не выбран'}), 400
    
    template = Presentation.query.filter_by(id=template_id, is_template=True).first_or_404()
    
    _root, extension = os.path.splitext(file.filename)
    filename = f"template-preview-{uuid.uuid4()}{extension}"
    
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'template_previews')
    os.makedirs(upload_folder, exist_ok=True)
    
    save_path = os.path.join(upload_folder, filename)
    file.save(save_path)
    
    file_url = url_for('static', filename=f'uploads/template_previews/{filename}', _external=False)
    template.preview_image = file_url
    db.session.commit()
    
    return jsonify({'url': file_url}), 200

@admin_bp.route('/admin/users', methods=['GET'])
@token_required
@admin_required
def get_all_users():
    users = User.query.order_by(User.id).all()
    output = []
    for user in users:
        output.append({
            'id': user.id,
            'email': user.email,
            'is_admin': user.is_admin,
            'can_use_ai': user.can_use_ai
        })
    return jsonify(output)

@admin_bp.route('/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user_access(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'can_use_ai' in data:
        user.can_use_ai = data['can_use_ai']
    
    db.session.commit()
    return jsonify({'message': f'Доступ для пользователя {user.email} обновлен'}), 200

@admin_bp.route('/admin/prompts', methods=['GET'])
@token_required
@admin_required
def get_all_prompts():
    prompts = SystemPrompt.query.order_by(SystemPrompt.id).all()
    output = []
    for p in prompts:
        output.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'prompt_text': p.prompt_text,
            'is_active': p.is_active,
            'updated_at': p.updated_at.isoformat()
        })
    return jsonify(output)

@admin_bp.route('/admin/prompts/<int:prompt_id>', methods=['PUT'])
@token_required
@admin_required
def update_prompt(prompt_id):
    prompt = SystemPrompt.query.get_or_404(prompt_id)
    data = request.get_json()

    if 'prompt_text' in data:
        prompt.prompt_text = data['prompt_text']
    if 'is_active' in data:
        prompt.is_active = data['is_active']
    
    db.session.commit()
    return jsonify({'message': f'Промпт "{prompt.name}" обновлен'}), 200