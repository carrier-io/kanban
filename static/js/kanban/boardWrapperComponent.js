const boardWrapper = {
    delimiters: ['[[', ']]'],
    props: [
        'create_modal_id', 
        'create_modal_form_id', 
        'create_btn_id', 
        'edit_modal_id',
        'edit_modal_form_id',
        'edit_btn_id',
        'clone_modal_id',
        'clone_btn_id',
    ],
    components: {
        kanbanBoard: kanbanBoard
    },
    data() {
        return {
            boards: [],
            currentBoard: null,
        }
    },

    async created(){
        params = this.getCurrentParams()
        const resp = await axios.get(boards_url, {params: {engagement: params.get('engagement')}})
        this.boards = resp.data['items']
        if (this.boards.length===0)
            return
        this.currentBoard = this.boards[0]
    },



    async mounted(){
        $(this.create_modal_id).on("show.bs.modal", () => {
            $(this.create_modal_form_id).get(0).reset();
        });

        $(this.edit_modal_id).on("show.bs.modal", () => {
            $(this.edit_modal_form_id).get(0).reset();
            $('#edit-name').val(this.currentBoard.name)
            columnsStr = this.currentBoard.columns.map(col => col.name).join()
            $('#edit-columns').val(columnsStr)
            $('#edit-url').val(this.currentBoard.tickets_url)
            $('#edit-update-url').val(this.currentBoard.state_update_url)
            $('#edit-mapping-field').val(this.currentBoard.mapping_field)
            $('#edit-id-field').val(this.currentBoard.ticket_id_field)
            $('#edit-ticket-name-field').val(this.currentBoard.ticket_name_field)
            $('#edit-event-list-url').val(this.currentBoard.event_list_url)
            $('#edit-event-detail-url').val(this.currentBoard.event_detail_url)
        });

        $(this.create_btn_id).click(() => {
            data = this.getFormData(this.create_modal_form_id)
            
            axios.post(boards_url, data)
              .then(response  => {
                this.boardCreationHandler(response, this.create_modal_id)
              })
              .catch(error => {
                console.log(error);
                showNotify("ERROR")
              });
        });

        $(this.edit_btn_id).click(() => {
            data = this.getFormData(this.edit_modal_form_id)

            axios.put(board_url+'/'+this.currentBoard.id, data)
                .then(resp => {
                    board = resp.data['item']
                    this.REMOVE_BOARD_MUTATION(board.id)
                    this.ADD_BOARD_MUTATION(board)
                    this.SET_CURRENT_BOARD_MUTATION(board.id)
                    showNotify("SUCCESS")
                    $(this.edit_modal_id).modal("hide");
                })
                .catch(error => {
                    console.log(error)
                    showNotify("ERROR")
                })
        });

        $(this.clone_modal_id).on('show.bs.modal', () => {
            txt = ""
            this.boards.forEach(board => {
                txt += `<option value="${board.id}">${board.name}</option>`
            })
            $('#existingBoardSelect').append(txt)
            
            boardsTabSelected = $("a#existing-boards-tab").hasClass('active')
            if(boardsTabSelected){
                this.setCloneBoardInput()
            }
        });

        $(this.clone_modal_id).on('hidden.bs.modal', function(){
            $('#existingBoardSelect').empty()
            $("#cloneBoardConfig").val('')
            $("#board-upload").val(null)
            $("#boardPreviewArea").empty()
        });

        $('#existingBoardSelect').change(() => {
            this.setCloneBoardInput()
        });

        $(this.clone_btn_id).click(()=>{
            configTxt = $("#cloneBoardConfig").val()
            try {
                payload = JSON.parse(configTxt)
            }
            catch(err){
                showNotify("ERROR", "Invalid JSON")
                return 
            } 
            axios.post(board_clone_url, payload).then(resp => {
                this.boardCreationHandler(resp, this.clone_modal_id)
            }).catch(error => {
                msg = error.response.data['error']
                showNotify("ERROR", msg)
            })
        });

        $("#board-upload").change(() => {
            this.readSingleFile()
        })

        $("#upload-template-tab").click(() => {
            this.readSingleFile()
        });
        
        $("#existing-boards-tab").click(() => {
            this.setCloneBoardInput()
        });
        
    },

    methods:{
        getCurrentParams(){
            params = new URLSearchParams(document.location.search)
            return params
        },

        readSingleFile() {
            var file = $("#board-upload").prop('files')[0];
            if (!file) {
              $("#cloneBoardConfig").val('')
              return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
              var contents = e.target.result;
              $("#cloneBoardConfig").val(contents)
            };
            reader.readAsText(file);
        },

        setCloneBoardInput(){
            boardId = $('#existingBoardSelect').val()
            config = this.getConfigFromBoard(boardId)
            $("#cloneBoardConfig").val(config)
        },

        boardCreationHandler(response, modal_id){
            resp_data = response.data['item']
            this.ADD_BOARD_MUTATION(resp_data)
            this.SET_CURRENT_BOARD_MUTATION(resp_data.id)
            $(modal_id).modal("hide");
            showNotify("SUCCESS")
        },

        splitColumnNames(columnsStr){
            result = []
            columns = columnsStr.split(',')
            columns.forEach(column => result.push(column.trim()))
            return result
        },

        getFormData(form_id){
            var data = $(form_id).serializeObject();
            data['columns'] = this.splitColumnNames(data['columns'])
            return data
        },

        getConfigFromBoard(boardId){
            boards = this.boards.filter(board => board.id == boardId)
            if (boards.length == 0){
                return
            }
            board = JSON.parse(JSON.stringify(boards[0]))
            board = this.mapEventColumnNames(board)
            config = this.removeIdsFromObject(board)
            config['columns'] = this.flattenList(config.columns, 'name')
            return JSON.stringify(config, undefined, 4)
        },

        removeIdsFromObject(object){
            token = 'id'
            for (attr in object){
                if (attr.includes(token) && !attr.includes('field')){
                    delete object[attr]
                    continue
                }
                if (typeof object[attr] == 'object'){
                    this.removeIdsFromObject(object[attr])
                }    
            }
            return object
        },

        flattenList(objectList, field){
            result = []
            objectList.forEach(object => {
                result.push(object[field])
            })
            return result
        },

        mapEventColumnNames(board){
            mapping = {}

            board.columns.forEach(column => {
                mapping[column.id] = column.name
            })

            for (let i=0; i<board.events.length; i++){
                sourceColumnId = board.events[i]['source_column']
                targetColumnId = board.events[i]['target_column']
                board.events[i]['source_column'] = mapping[sourceColumnId]
                board.events[i]['target_column'] = mapping[targetColumnId]
            }
            return board
        },

        onSelectChange(event){
            boardId = event.target.value
            this.SET_CURRENT_BOARD_MUTATION(boardId)
        },

        onDeleteBoard(boardId){
            axios.delete(board_url+'/'+boardId)
                .then(() => {
                    this.REMOVE_BOARD_MUTATION(boardId)
                    firstEl = this.boards.find(() => true)
                    boardId = firstEl ? firstEl.id : null
                    this.SET_CURRENT_BOARD_MUTATION(boardId)
                    showNotify("SUCCESS")
                })
                .catch(error => console.log(error))
        },

        SET_CURRENT_BOARD_MUTATION(boardId){
            ind = this.boards.findIndex(board => board.id == boardId)
            this.currentBoard = this.boards[ind]
        },

        ADD_BOARD_MUTATION(board){
            this.boards.push(board)
        },
        
        REMOVE_BOARD_MUTATION(boardId){
            ind = this.boards.findIndex(board => board.id == boardId)
            this.boards.splice(ind, 1)
        },

    },

    template: `<div class="d-flex justify-content-end mt-3 p-1">
        <select class="form-control mr-4" @change="onSelectChange" id="boardsSelect">
            <option v-for="board in boards" :value="board.id" :selected="currentBoard.id==board.id">[[board.name]]</option>
        </select>
        <button class="btn btn-lg btn-secondary mr-2" data-toggle="modal" :data-target="clone_modal_id">
            <i class="fa fa-plus mr-2"></i>
            Create From Template
        </button>
        <button class="btn btn-lg btn-secondary mr-2" data-toggle="modal" :data-target="create_modal_id">
            <i class="fa fa-plus mr-2"></i>
            New Board
        </button>
    </div> 

    <kanban-board
        ref="board"
        v-if="currentBoard"
        :board="currentBoard"
        :edit_modal_id="edit_modal_id"
        @deleteBoard="onDeleteBoard"
    >
    </kanban-board>`
} 


register_component('boardWrapper', boardWrapper)