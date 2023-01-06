from marshmallow import fields
from tools import ma
from plugins.kanban.models.attachment import Attachment


class AttachmentSchema(ma.SQLAlchemyAutoSchema):
    file_name = fields.String(allow_none=True)

    class Meta:
        model = Attachment
        fields = (
            'id',
            'issue_id',
            'file_name',
            'url',
            'created_at',
        )
        dump_only = (
            'id',
            'url',
            'updated_at',
            'created_at',
        )


attachment_schema = AttachmentSchema()
attachments_schema = AttachmentSchema(many=True)
