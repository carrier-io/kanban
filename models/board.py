from plugins.shared_orch.app_objects import db
from .mixins import BaseModelMixin


class Board(BaseModelMixin, db.Model):
    __tablename__ = "kanban_boards"
    project_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    hash_id = db.Column(db.String(64), nullable=False)
    tickets_url = db.Column(db.String(500), nullable=False)
    state_update_url = db.Column(db.String(500), nullable=False)
    mapping_field = db.Column(db.String(150), nullable=False)
    ticket_name_field = db.Column(db.String(150), nullable=False)
    ticket_id_field = db.Column(db.String(150), nullable=False)
    event_list_url = db.Column(db.String(500), nullable=True)
    event_detail_url = db.Column(db.String(500), nullable=True)
    tickets_attributes = db.Column(db.ARRAY(db.String(64)), default=[])
    engagement = db.Column(db.String(64), nullable=True, default=None)

    columns = db.relationship("BoardColumn", backref='board', cascade="all,delete", lazy=False)


class BoardColumn(BaseModelMixin, db.Model):
    __tablename__ = "kanban_board_columns"
    board_id = db.Column(db.Integer, db.ForeignKey('kanban_boards.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    order = db.Column(db.Integer, nullable=False)




    

