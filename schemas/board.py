from tools import ma
from marshmallow import fields
from plugins.kanban.models.board import Board
from marshmallow.exceptions import ValidationError


class CloneBoardSchema(ma.SQLAlchemyAutoSchema):
    columns = fields.List(fields.String(), required=True)
    
    class Meta:
        model = Board
        fields = (
            'name',
            'tickets_url',
            'state_update_url',
            'mapping_field',
            'ticket_name_field',
            'ticket_id_field',
            'columns',
            'event_list_url',
            'event_detail_url',
        )


class BoardSchema(ma.SQLAlchemyAutoSchema):
    columns = fields.Method("get_columns", deserialize='load_columns')
    
    class Meta:
        model = Board
        fields = (
            'id',
            'name',
            'hash_id',
            'tickets_url',
            'state_update_url',
            'mapping_field',
            'ticket_name_field',
            'ticket_id_field',
            'event_list_url',
            'event_detail_url',
            'columns',
            'events',
        )
        dump_only = (
            'id',
            'hash_id',
        )

    def get_columns(self, obj):
        columns = sorted(obj.columns, key=lambda x: x.order)
        return [{'name':col.name, 'id':col.id} for col in columns]
    
    def load_columns(self, value):
        if not isinstance(value, list):
            raise ValidationError("Not a list", 'columns')
        
        for el in value:
            if not isinstance(el, str):
                raise ValidationError("column list's element is not str", 'columns')

        return value


board_schema = BoardSchema()
boards_schema = BoardSchema(many=True)
clone_board_schema = CloneBoardSchema()