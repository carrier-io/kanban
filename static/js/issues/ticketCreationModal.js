let boardDropArea, boardPreviewArea;

async function fetchUsersAPI() {
    const api_url = V.build_api_url('admin', 'users');
    const res = await fetch (`${api_url}/${getSelectedProjectId()}`,{
        method: 'GET',
    });
    return res.json();
}

$(document).on('vue_init', async (e) => {
    boardDropArea = document.getElementById('dropArea');
    boardPreviewArea = document.getElementById('previewArea');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, preventDefaults, false)
    })

    ['dragenter', 'dragover'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, highlight, false)
    });

    ['dragleave', 'drop'].forEach(eventName => {
        boardDropArea.addEventListener(eventName, unhighlight, false)
    })

    function highlight(e) {
        boardDropArea.classList.add('highlight')
    }
    function unhighlight(e) {
        boardDropArea.classList.remove('highlight')
    }
    boardDropArea.addEventListener('drop', handleDrop, false)
    function handleDrop(e) {
        let dt = e.dataTransfer
        let files = dt.files
        handleFiles(files)
    }
})

function preventDefaults (e) {
    e.preventDefault()
    e.stopPropagation()
}

function handleFiles(files) {
    ([...files]).forEach(uploadFile)
}

function uploadFile(file) {
    const item = document.createElement('div');
    item.classList.add('preview-area_item', 'preview-area_loader');
    const fileName = document.createElement('span');
    fileName.innerText = file.name;
    item.append(fileName);
    boardPreviewArea.append(item);
    setTimeout(() => {
        item.classList.remove('preview-area_loader');
        item.classList.add('preview-area_close');
    }, 1000);
}

const TicketCreationModal = {
    props: {
        engagement:{},
    },
    components: {
        'tag-input': TagInput,
    },
    data(){
        return {
            tagBtn: null,
            selectedTags: [],
            users: [],
        }
    },
    async mounted(){

        $(document).on('vue_init', async (e) => {
            const resp = await fetchUsersAPI()
            this.users = resp['rows'] || []
            this.setUsersOptions()
        })

        $("#modal-create").on("show.bs.modal", () => {
            $("#form-create").get(0).reset();
            this.setEngagementOptions("#input-engagement", this.engagement.hash_id)
        });

        $("#modal-create").on("hidden.bs.modal",() => {
            this.clearOptions("#input-engagement")
            $("#textarea-description").summernote('reset')
        });

        $('#textarea-description').summernote({
            height: 150,                 // set editor height
            minHeight: null,             // set minimum height of editor
            maxHeight: null,             // set maximum height of editor
            focus: true,                 // set focus to editable area after initializing summernote
        });
    },
    methods: {
        setTags(tags){
            this.selectedTags = tags
        },
        setOptions(htmlText, selectId){
            $(selectId).append(htmlText)
            $(selectId).selectpicker('refresh')
            $(selectId).selectpicker('render')
        },

        generateHtmlOptions(items, idField='id', titleField='name', currentUserId=null){
            result = items.reduce((acc, curr) => {
                selected = curr[idField] == currentUserId ? "selected" : "" 
                return acc + `<option value="${curr[idField]}" ${selected}>${curr[titleField]}</option>`
            }, '')
            return result
        },

        setUsersOptions(){
            htmlTxt = this.generateHtmlOptions(this.users, 'id', 'name')
            this.setOptions(htmlTxt, '#input-assignee')
        },

        setEngagementOptions(selectId='#input-engagement', engagement=null){
            engs = vueVm.registered_components.engagement_container.engagements
            engs = JSON.parse(JSON.stringify(engs))
            engs[0]['name'] = "Select"
            htmlTxt = this.generateHtmlOptions(engs, 'hash_id', 'name', engagement)
            this.setOptions(htmlTxt, selectId)
        },
        clearOptions(selectId='#input-engagement'){
            $(selectId).empty()
            $(selectId).selectpicker('refresh')
            $(selectId).selectpicker('render')
        },
        save(){
            var data = $("#form-create").serializeObject();
            data['description'] = $("#textarea-description").summernote('code')
            data['tags'] = this.selectedTags.map(tag => {
                return {
                    tag: tag.title,
                    color: tag.hex,
                }
            })

            axios.post(ticketsUrl, data)
              .then(response => {
                issueId = response.data['item']['id']
                this.uploadAttachments(issueId)
                $("#modal-create").modal("hide");
                $("#issues-table").bootstrapTable("refresh", {});
                showNotify("SUCCESS", "Ticket created");
              })
              .catch(function (error) {
                console.log(error);
              }); 
        },
        uploadAttachments(issueId){
            var formData = new FormData();
            var files = $("#dropInput")[0].files
            
            // return if no file has been selected
            if (files.length==0) return
            
            for (let i=0; i<files.length; i++){
                formData.append("files[]", files[i])
            }
            
            axios.post(attachmentsUrl+issueId, payload=formData)
                .then(() => {
                    $("#dropInput").val(null);
                    $("#previewArea").empty()
                })
                .catch((error)=>{
                    showNotify("ERROR", "Attachment uploading failed")
                })
        }
          
    },
    template: `
    <button 
        type="button" 
        class="btn btn-basic btn-sm mr-2" 
        data-toggle="modal" 
        data-target="#modal-create"
    >
        <i class="fas fa-plus mr-2"></i>
        Ticket
    </button>

    <div id="modal-create" class="modal modal-small fixed-left fade shadow-sm" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-aside" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="row w-100">
                        <div class="col">
                            <h2>Create Ticket</h2>
                        </div>
                        <div class="col-xs">
                            <button type="button" class="btn  btn-secondary mr-2" data-dismiss="modal" aria-label="Close">
                                Cancel
                            </button>
                            <button type="button" @click="save" class="btn btn-basic">Save</button>
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <form id="form-create">
                        <div class="section p-1">
                            
                            <div class="custom-input mb-3">
                                <label for="input-name" class="font-weight-bold mb-1">Title</label>
                                <input id="input-name" type="text" name="title" placeholder="Text">
                            </div>
                        
                            <div class="custom-input mb-3">
                                <label for="input-severity" class="font-weight-bold mb-1">Severity</label>
                                <select class="selectpicker bootstrap-select__b w-100-imp" data-style="btn" name="severity" id="input-severity">
                                    <option>Critical</option>
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                    <option>Info</option>
                                </select>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="input-type" class="font-weight-bold mb-1">Ticket Type</label>
                                <select class="selectpicker bootstrap-select__b w-100-imp" data-style="btn" name="type" id="input-type">
                                    <option>Vulnerability</option>
                                    <option>Bug</option>
                                    <option>Activity</option>
                                </select>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="input-external-link" class="font-weight-bold mb-1">External Link</label>
                                <input type="text"  name="external_link" id="input-external-link" placeholder="Url">
                            </div>

                            <div class="custom-input mb-3">
                                <label for="input-engagement" class="font-weight-bold mb-1">Engagement</label>
                                <select class="selectpicker bootstrap-select__b w-100-imp" data-style="btn" name="engagement" id="input-engagement">
                                </select>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="input-tags" class="font-weight-bold mb-1">Tags</label>
                                <tag-input
                                    @updated="setTags"
                                >
                                </tag-input>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="input-assignee" class="font-weight-bold mb-1">Assignee</label>
                                <select class="selectpicker bootstrap-select__b w-100-imp" data-style="btn" name="assignee" id="input-assignee">
                                </select>
                            </div>

                            <div class="row">
                                <div class="col">
                                    <div class="form-group">
                                        <label for="start_date" class="font-weight-bold mb-1">Start Date</label>
                                        <input type="date" name="start_date" id="input-start-date" class="form-control">
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="form-group">
                                        <label for="end_date" class="font-weight-bold mb-1">End Date</label>
                                        <input type="date" name="end_date" id="input-end-date" class="form-control">
                                    </div>
                                </div>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="text-description" class="font-weight-bold mb-1">Description</label>
                                <div name="description" id="textarea-description"></div>
                            </div>

                            <div class="custom-input mb-3">
                                <label for="text-description" class="font-weight-bold mb-1">Attachments</label>
                                <div class="card w-100 card-stripped p-3">
                                    <form id="upload-attachment" enctype="multipart/form-data">
                                        <div id="dropArea" class="drop-area">
                                            <input type="file" id="dropInput" multiple accept="image/*" onchange="handleFiles(this.files)">
                                            <label for="dropInput" class="mb-0 d-flex align-items-center justify-content-center">Drag & drop file or <span>&nbsp;browse</span></label>
                                        </div>
                                        <div id="previewArea" class="preview-area"></div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    `
}
