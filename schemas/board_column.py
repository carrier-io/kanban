from marshmallow import fields
from tools import ma
from plugins.kanban.models.board import BoardColumn


class BoardColumnSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = BoardColumn
        fields = (
            "id",
            "name",
            "board_id"
        )


board_columns_schema = BoardColumnSchema(many=True)