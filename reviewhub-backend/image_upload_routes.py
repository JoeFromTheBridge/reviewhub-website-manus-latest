from flask import request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from file_storage import file_storage

def register_image_routes(app, db):
    """Register image upload routes with the Flask app"""
    
    # Image model for storing metadata
    class Image(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
        filename = db.Column(db.String(255), nullable=False)
        original_filename = db.Column(db.String(255), nullable=False)
        file_hash = db.Column(db.String(32), nullable=True)
        file_size = db.Column(db.Integer, nullable=False)
        mime_type = db.Column(db.String(100), nullable=True)
        main_url = db.Column(db.String(500), nullable=False)
        thumbnail_url = db.Column(db.String(500), nullable=True)
        alt_text = db.Column(db.String(255), nullable=True)
        caption = db.Column(db.Text, nullable=True)
        image_type = db.Column(db.String(50), nullable=False)
        related_id = db.Column(db.Integer, nullable=True)
        is_active = db.Column(db.Boolean, default=True)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
        
        def to_dict(self):
            return {
                'id': self.id,
                'filename': self.filename,
                'original_filename': self.original_filename,
                'file_size': self.file_size,
                'main_url': self.main_url,
                'thumbnail_url': self.thumbnail_url,
                'alt_text': self.alt_text,
                'caption': self.caption,
                'image_type': self.image_type,
                'related_id': self.related_id,
                'created_at': self.created_at.isoformat() if self.created_at else None
            }

    # ------------------------------
    # IMAGE UPLOAD ROUTES (unchanged)
    # ------------------------------

    @app.route('/api/images/upload/review', methods=['POST'])
    @jwt_required()
    def upload_review_image():
        try:
            user_id = get_jwt_identity()
            if 'image' not in request.files:
                return jsonify({'error': 'No image file provided'}), 400
            
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400

            alt_text = request.form.get('alt_text', '')
            caption = request.form.get('caption', '')
            review_id = request.form.get('review_id')

            upload_result = file_storage.upload_review_image(file, user_id, review_id)

            image = Image(
                user_id=user_id,
                filename=upload_result['filename'],
                original_filename=upload_result['original_filename'],
                file_hash=upload_result['file_hash'],
                file_size=upload_result['file_size'],
                main_url=upload_result['main_url'],
                thumbnail_url=upload_result['thumbnail_url'],
                alt_text=alt_text,
                caption=caption,
                image_type='review',
                related_id=int(review_id) if review_id else None
            )
            db.session.add(image)
            db.session.commit()

            return jsonify({'success': True, 'image': image.to_dict()}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500

    @app.route('/api/images/upload/multiple', methods=['POST'])
    @jwt_required()
    def upload_multiple_images():
        try:
            user_id = get_jwt_identity()
            if 'images' not in request.files:
                return jsonify({'error': 'No image files provided'}), 400

            files = request.files.getlist('images')
            review_id = request.form.get('review_id')

            uploaded_images = []

            for file in files:
                if not file.filename:
                    continue

                upload_result = file_storage.upload_review_image(file, user_id, review_id)

                image = Image(
                    user_id=user_id,
                    filename=upload_result['filename'],
                    original_filename=upload_result['original_filename'],
                    file_hash=upload_result['file_hash'],
                    file_size=upload_result['file_size'],
                    main_url=upload_result['main_url'],
                    thumbnail_url=upload_result['thumbnail_url'],
                    image_type='review',
                    related_id=int(review_id) if review_id else None
                )
                db.session.add(image)
                uploaded_images.append(image.to_dict())

            db.session.commit()
            return jsonify({'success': True, 'images': uploaded_images}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


    # ------------------------------
    # FIXED STATIC SERVING ROUTES
    # ------------------------------

    @app.route('/api/uploads/thumbnails/<filename>')
    def serve_thumbnail(filename):
        """Serve thumbnail images"""
        thumbnail_dir = os.path.join(file_storage.upload_folder, "thumbnails")
        return send_from_directory(thumbnail_dir, filename)

    @app.route('/api/uploads/reviews/<filename>')
    def serve_review_image(filename):
        """Serve main review images"""
        review_dir = os.path.join(file_storage.upload_folder, "reviews")
        return send_from_directory(review_dir, filename)

    # Generic fallback
    @app.route('/api/uploads/<path:filename>')
    def uploaded_file_api(filename):
        """Fallback for legacy stored paths"""
        return send_from_directory(file_storage.upload_folder, filename)

    @app.route('/uploads/<path:filename>')
    def uploaded_file_legacy(filename):
        """Legacy route for backward compatibility"""
        return send_from_directory(file_storage.upload_folder, filename)

    return Image
