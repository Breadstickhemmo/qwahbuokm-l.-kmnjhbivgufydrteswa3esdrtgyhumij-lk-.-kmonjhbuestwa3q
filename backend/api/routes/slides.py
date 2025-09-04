from flask import request, jsonify, Blueprint, g
from ..models import Presentation, Slide
from ..extensions import db
from .presentations import token_required

slides_bp = Blueprint('slides', __name__)

@slides_bp.route('/presentations/<string:presentation_id>/slides/reorder', methods=['PUT'])
@token_required
def reorder_slides(presentation_id):
    presentation = Presentation.query.get_or_404(presentation_id)
    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403

    data = request.get_json()
    slide_ids = data.get('slide_ids')

    if not slide_ids or not isinstance(slide_ids, list):
        return jsonify({'message': 'Требуется массив ID слайдов'}), 400

    slides = Slide.query.filter_by(presentation_id=presentation_id).all()
    slide_map = {slide.id: slide for slide in slides}

    if len(slide_ids) != len(slides) or not all(sid in slide_map for sid in slide_ids):
        return jsonify({'message': 'Некорректный набор ID слайдов'}), 400

    for index, slide_id in enumerate(slide_ids):
        slide_map[slide_id].slide_number = index + 1
    
    db.session.commit()

    return jsonify({'message': 'Порядок слайдов обновлен'}), 200

@slides_bp.route('/presentations/<string:presentation_id>/slides', methods=['POST'])
@token_required
def add_slide(presentation_id):
    presentation = Presentation.query.get_or_404(presentation_id)
    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403

    max_slide_number = db.session.query(db.func.max(Slide.slide_number)).filter_by(presentation_id=presentation.id).scalar() or 0
    
    new_slide = Slide(
        slide_number=max_slide_number + 1,
        presentation_id=presentation.id
    )
    db.session.add(new_slide)
    db.session.commit()

    return jsonify({
        'id': new_slide.id,
        'slide_number': new_slide.slide_number,
        'background_color': new_slide.background_color,
        'elements': []
    }), 201

@slides_bp.route('/slides/<int:slide_id>', methods=['DELETE'])
@token_required
def delete_slide(slide_id):
    slide = Slide.query.get_or_404(slide_id)
    presentation = Presentation.query.get(slide.presentation_id)

    if presentation.user_id != g.current_user.id:
        return jsonify({'message': 'Доступ запрещен'}), 403
    
    if Slide.query.filter_by(presentation_id=presentation.id).count() <= 1:
        return jsonify({'message': 'Нельзя удалить последний слайд'}), 400

    db.session.delete(slide)
    db.session.commit()

    return jsonify({'message': 'Слайд успешно удален'}), 204