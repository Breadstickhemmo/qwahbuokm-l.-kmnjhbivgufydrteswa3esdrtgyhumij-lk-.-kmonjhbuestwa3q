from flask import request, jsonify, Blueprint, g, current_app
from ..models import SlideElement, Slide, Presentation
from ..extensions import db
from .presentations import token_required
import re
import os

elements_bp = Blueprint('elements', __name__)

def get_youtube_id(url):
    if url is None:
        return None
    regex = r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})"
    match = re.search(regex, url)
    return match.group(1) if match else None

@elements_bp.route('/slides/<int:slide_id>/elements', methods=['POST'])
@token_required
def add_element_to_slide(slide_id):
    slide = Slide.query.get_or_404(slide_id)
    presentation = Presentation.query.get_or_404(slide.presentation_id)
    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403

    data = request.get_json()
    element_type = data.get('element_type')
    if not element_type:
        return jsonify({'message': 'Тип элемента обязателен'}), 400

    new_element = SlideElement(
        slide_id=slide_id,
        element_type=element_type,
        pos_x=data.get('pos_x', 100),
        pos_y=data.get('pos_y', 100),
        width=data.get('width', 400),
        height=data.get('height', 150),
        content=data.get('content', 'Новый текст')
    )
    
    response_data = {}

    if element_type == 'YOUTUBE_VIDEO':
        youtube_id = get_youtube_id(data.get('content'))
        if not youtube_id:
            return jsonify({'message': 'Некорректная ссылка на YouTube'}), 400
        new_element.content = youtube_id
        response_data['thumbnailUrl'] = f"https://img.youtube.com/vi/{youtube_id}/0.jpg"

    db.session.add(new_element)
    db.session.commit()
    
    response_data.update({
        'id': new_element.id,
        'element_type': new_element.element_type,
        'pos_x': new_element.pos_x,
        'pos_y': new_element.pos_y,
        'width': new_element.width,
        'height': new_element.height,
        'content': new_element.content,
        'font_size': new_element.font_size
    })
    
    return jsonify(response_data), 201

@elements_bp.route('/elements/<string:element_id>', methods=['PUT'])
@token_required
def update_element(element_id):
    element = SlideElement.query.get_or_404(element_id)
    slide = Slide.query.get_or_404(element.slide_id)
    presentation = Presentation.query.get_or_404(slide.presentation_id)
    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403
        
    data = request.get_json()
    element.pos_x = data.get('pos_x', element.pos_x)
    element.pos_y = data.get('pos_y', element.pos_y)
    element.width = data.get('width', element.width)
    element.height = data.get('height', element.height)
    element.content = data.get('content', element.content)
    
    db.session.commit()
    return jsonify({'message': 'Элемент обновлен'}), 200

@elements_bp.route('/elements/<string:element_id>', methods=['DELETE'])
@token_required
def delete_element(element_id):
    element = SlideElement.query.get_or_404(element_id)
    slide = Slide.query.get_or_404(element.slide_id)
    presentation = Presentation.query.get_or_404(slide.presentation_id)
    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403

    if element.element_type in ['IMAGE', 'UPLOADED_VIDEO'] and element.content:
        try:
            filename = element.content.split('/')[-1]
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            print(f"Error deleting file for element {element_id}: {e}")
            
    db.session.delete(element)
    db.session.commit()
    return jsonify({'message': 'Элемент удален'}), 204