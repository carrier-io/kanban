from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
# from tools import db

from .mixins import BaseModelMixin
from plugins.shared_orch.app_objects import db


class Board(BaseModelMixin, db.Model):
    __tablename__ = "kanban_boards"
    id = Column(Integer, primary_key=True)
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
    schedules = db.Column(db.ARRAY(db.JSON), nullable=True, default=[])
    columns = db.relationship("BoardColumn", backref='board', cascade="all,delete", lazy=False)


# class Board(BaseModelMixin, db.Base):
#     __tablename__ = "kanban_boards"
#     __table_args__ = {'schema': 'tenant'}

#     id = Column(Integer, primary_key=True)
#     project_id = Column(Integer, nullable=False)
#     name = Column(String(80), nullable=False)
#     hash_id = Column(String(64), nullable=False)
#     tickets_url = Column(String(500), nullable=False)
#     state_update_url = Column(String(500), nullable=False)
#     mapping_field = Column(String(150), nullable=False)
#     ticket_name_field = Column(String(150), nullable=False)
#     ticket_id_field = Column(String(150), nullable=False)
#     event_list_url = Column(String(500), nullable=True)
#     event_detail_url = Column(String(500), nullable=True)
#     tickets_attributes = Column(ARRAY(String(64)), default=[])
#     engagement = Column(String(64), nullable=True, default=None)

#     columns = relationship("BoardColumn", backref='board', cascade="all,delete", lazy=False)



class BoardColumn(BaseModelMixin, db.Model):
    __tablename__ = "kanban_board_columns"
    board_id = db.Column(db.Integer, db.ForeignKey('kanban_boards.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    order = db.Column(db.Integer, nullable=False)


# class BoardColumn(BaseModelMixin, db.Base):
#     __tablename__ = "kanban_board_columns"
#     __table_args__ = {'schema': 'tenant'}
    
#     id = Column(Integer, primary_key=True)
#     board_id = Column(Integer, ForeignKey('tenant.kanban_boards.id'), nullable=False)
#     name = Column(String(80), nullable=False)
#     order = Column(Integer, nullable=False)




    

