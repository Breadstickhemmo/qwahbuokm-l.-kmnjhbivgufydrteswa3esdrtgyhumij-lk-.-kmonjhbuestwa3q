from flask import Blueprint, jsonify, g, request
from .presentations import token_required
from ..models import Presentation, Slide, SlideElement
from ..extensions import db

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/templates', methods=['GET'])
@token_required
def get_templates():
    templates = Presentation.query.filter_by(is_template=True).all()
    output = []
    for t in templates:
        output.append({
            'id': t.id,
            'title': t.title,
            'preview_image': t.preview_image
        })
    return jsonify(output)


@templates_bp.route('/presentations/from-template', methods=['POST'])
@token_required
def create_presentation_from_template():
    data = request.get_json()
    template_id = data.get('template_id')
    
    template = Presentation.query.filter_by(id=template_id, is_template=True).first_or_404()

    new_presentation = Presentation(
        title=template.title,
        owner=g.current_user,
        is_template=False
    )
    db.session.add(new_presentation)
    db.session.flush()

    for template_slide in sorted(template.slides, key=lambda s: s.slide_number):
        new_slide = Slide(
            slide_number=template_slide.slide_number,
            background_color=template_slide.background_color,
            background_image=template_slide.background_image,
            presentation_id=new_presentation.id
        )
        db.session.add(new_slide)
        db.session.flush()

        for template_element in template_slide.elements:
            new_element = SlideElement(
                element_type=template_element.element_type,
                pos_x=template_element.pos_x,
                pos_y=template_element.pos_y,
                width=template_element.width,
                height=template_element.height,
                content=template_element.content,
                font_size=template_element.font_size,
                slide_id=new_slide.id
            )
            db.session.add(new_element)
    
    db.session.commit()
    
    return jsonify({'id': new_presentation.id}), 201