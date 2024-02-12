from tools import db


def init_db():
    from .models.board import Board
    from .models.board import BoardColumn

    db.get_shared_metadata().create_all(bind=db.engine)

