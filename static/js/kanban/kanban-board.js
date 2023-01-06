const kanban = {
    data() {
        return {
            issues: [],
            attachments:[],
            issue: {},
            items: {'NEW_ISSUE':[], 'TICKET_CREATION_FAILED':[], 'CLOSED_ISSUE':[], 'TO_BE_NOTIFIED':[], 'DUE_DATE_MISSED':[]},
            kanbanObject: null,

        }
    },
    async mounted() {
        await this.getKanbanItems()
        await this.populateItemsFromResponse()
        await this.createKanbanBoard()
        this.addEventHandlers()

        // clearing fields data when ticket model closes
        $('#ticketDetailModal').on('hidden.bs.modal', function(){
            $("#issue-detail").empty();
            $("#comments-list").empty();
            $("#attachments-container").empty();
            $('#comment-textarea').summernote('code', '');
            $('#logs-container').empty();
            $('#opened-by').empty();
            $('#comments-container').empty();
        });

        $("#move-to-resolved").on('click', function(){
            moveButtonCallback('moving_to_resolved');
        });

        $("#move-to-inprogress").on('click', function(){
            moveButtonCallback('moving_to_in_progress');
        });

        $('#book-issue').on('click', function(){
            select = $('.form-select');
            issue_id = $('#issue-id').data('issue-id');
            url = issues_url + '/' + issue_id
            if (select.val()!='null'){
                user_id = select.val()
            }
            else{
                user_id = null
            }
            axios.put(url, {'assigned_user_id': user_id})
        });

        $("#comment-submit").on('click', function(){
            if (!$('#comment-textarea').summernote('isEmpty')){
                comment = $("#comment-textarea").summernote('code')
                issueHashId = $('#ticketDetailModal').data('issue-id')
                data = {"comment": comment}
                axios.post(comments_url+'/'+issueHashId, payload=data)
                    .then(response => {
                        addCommentIntoDOM(response.data['item'])
                        $('#comment-textarea').summernote('blur')
                        $('#comment-textarea').summernote('code', '')
                    })

            }
        });

        $("#upload-attachment").submit(function(e){
            e.preventDefault();
            var formData = new FormData();
            var files = $("#dropInput")[0].files
            
            // return if no file has been selected
            if (files.length==0) return

            for (let i=0; i<files.length; i++){
                formData.append("files[]", files[i])
            }

            const issueId = $('#ticketDetailModal').data('issue-id')
            axios.post(attachmentsUrl+'/'+issueId, payload=formData)
                .then(response => {
                    attachments = response['data']['items']
                    attachments.forEach(file => addAttachmentIntoDOM(file));
                    showNotify("SUCCESS")
                    $("#dropInput").val(null);
                    $("#previewArea").empty()
                })
        });

        $('#comment-textarea').summernote({
            height: 150,                 // set editor height
            minHeight: null,             // set minimum height of editor
            maxHeight: null,             // set maximum height of editor
            focus: true,                  // set focus to editable area after initializing summernote
            callbacks:{
                onImageUpload(files){
                    sendFile(files[0], $('#comment-textarea'));
                },
            }
        });

        socket.on("update_boards", (data) => {
            this.kanbanObject.removeElement(data.id)
            let elementObject = {
                id: `${data.id}`,
                title: `${data.title}`,
            }
            this.kanbanObject.addElement(data.targetId, elementObject, 0)
        });
    },
    methods: {
        async getKanbanItems(){
            const response = await axios.get(ticketsUrl)
            this.issues = response.data['rows']
        },
        populateItemsFromResponse(){
            this.issues.forEach((issue, index) => {
                title = `${issue['snapshot']['title']}`;
                // full_name = issue['last_move_action'] ? issue['last_move_action']['user_full_name'] : null;
                // time = issue['last_move_action'] ? moment(issue['last_move_action']['updated_at']).format('lll') : null;
                full_name = null
                time = null
                this.items[`${issue['state']['value']}`].push(
                    {
                        id: `${issue['id']}`,
                        title: this.createCardElement(title, full_name, time, issue),
                    }
                )
            });
        },
        async makeUpdateRequest(url, payload){
            await axios.put(url, payload);
        },

        createCardElement(title, full_name, time, issue){
            let footer = full_name ? `Moved by ${full_name} on ${time}` : 'NEW ISSUE'
            if (((Date.now()>=Date.parse(issue['due_date'])) || (Date.now()-Date.parse(issue['updated_at']))>=1000*60*60*24*7) &&
                     issue['status']=='NEW'){
                stile = ' bg-danger text-white'
            }
            else {
                stile = ''
            }
            return `<div class="card">
            <div class="card-body${stile}">
              <p class="card-text">${title}</p>
            </div>
          </div>`
        },

        addEventHandlers(){
            let _kanbanObject = this.kanbanObject;
            this.kanbanObject.options.dropEl = (el, target, source) => {
                sourceId = source.parentElement.getAttribute('data-id')
                targetId = target.parentElement.getAttribute('data-id')
                $("#ticketConfModal").modal('show');
                $('#move-btn').unbind('click')
                $('#no-move-btn').unbind('click')
                $('#move-btn').on('click', function (){
                    $("#ticketConfModal").modal('hide');
                    // change status of issue below
                    url = issue_url + '/' + el.dataset.eid
                    axios.put(url, {'status': targetId})
                        .then(response => showNotify("SUCCESS", "Ticket moved"))
                        .catch(response => showNotify("ERROR"))

                    // notification to teams
                    socket.emit("issue_moved", {
                        id: el.dataset.eid,
                        title: el.innerHTML,
                        targetId: targetId
                    })
                });
                $('#no-move-btn').on('click', function(){
                    _kanbanObject.removeElement(el.dataset.eid)
                     let elementObject = {
                        id: `${el.dataset.eid}`,
                        title: `${el.innerHTML}`,
                    }
                    _kanbanObject.addElement(sourceId, elementObject, 0)
                });
            }

            this.kanbanObject.options.click = async el => {
            //this from vue
                issueId = el.dataset.eid 
                $('#ticketDetailModal').data('issue-id', issueId)
                this.issue = this.issues.filter(issue => issue['id'] == issueId)
                create_table_body(this.issue);

                response = await axios.get(attachmentsUrl+"/"+issueId)
                this.attachments = response.data['items']
                createAttachments(this.attachments);


                response = await axios.get(comments_url+"/"+issueId)
                this.comments = response.data['items']
                populateComments(this.comments)
                $("#ticketDetailModal").modal('show');
                // axios.get(url)
                //     .then(response => {
                //     //this from click
                //         this.issue = response.data;
                //         create_table_body(this.issue);
                //         createAttachments(this.issue['attachments']);
                //         // create_list_book(this.issue);
                //         // createLogs(this.issue['issue_logs']);
                //         // opened_by(el.dataset.eid, response.data['user'])
                //         // axios.post(create_opened_by, {'id': el.dataset.eid, 'user': response.data['user']})
                //     });
                // $("#ticketDetailModal").modal('show');
                // $('#ticketDetailModal').on('hidden.bs.modal', function (){
                //     axios.post(delete_opened_by, {'id': el.dataset.eid})
                // });
            };
        },

        createKanbanBoard(){
            this.kanbanObject = new jKanban({
                element: "#myKanban",
                responsivePercentage: true,
                boards: [
                    {
                        id: "NEW_ISSUE",
                        title: "New Issues",
                        class: "bg-primary, text-white",
                        item: this.items['NEW_ISSUE'],
            
                    },
                    {
                        id: "TICKET_CREATION_FAILED",
                        title: "Ticket Creation Failed",
                        class: "bg-primary, text-white",
                        item: this.items['TICKET_CREATION_FAILED'],
                
                    },
                    {
                        id: "CLOSED_ISSUE",
                        title: "Closed",
                        class: "bg-primary, text-white",
                        item: this.items['CLOSED_ISSUE'],
                    },
                    {
                        id: "TO_BE_NOTIFIED",
                        title: "To Be Notified",
                        class: "bg-primary, text-white",
                        item: this.items['TO_BE_NOTIFIED'],
                    },
                    {
                        id: "DUE_DATE_MISSED",
                        title: "Due Date Missed ",
                        class: "bg-primary, text-white",
                        item: this.items['DUE_DATE_MISSED'],
                    },

                ]
            });

        }
    },
    template:`
      <div class="card card-table-sm mt-3 p-3">
        <div class="card-header">
            <div class="row">
                <div class="col-4">
                    <h4>Kanban Board</h4>
                </div>
            </div>
        </div>
        <div class="card-body card-tableless">
            <div id="myKanban"></div>
        </div>
    </div>`
}

register_component('Kanban', kanban)
