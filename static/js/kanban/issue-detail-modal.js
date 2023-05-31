$(document).on('vue_init', () => {
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

    $("#comment-submit").on('click', function(){
        if (!$('#comment-textarea').summernote('isEmpty')){
            comment = $("#comment-textarea").summernote('code')
            issueHashId = $('#ticketDetailModal').data('issue-id')
            data = {"comment": comment}
            axios.post(comments_url+issueHashId, payload=data)
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
        axios.post(attachmentsUrl+issueId, payload=formData)
            .then(response => {
                attachments = response['data']['items']
                attachments.forEach(file => addAttachmentIntoDOM(file));
                showNotify("SUCCESS")
                $("#dropInput").val(null);
                $("#boardPreviewArea").empty()
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
})


function getFormData(form){
    let data = {}
    form.serializeArray().map(function(x){data[x.name] = x.value;});
    return data;
}

function sendFile(file, target_tag){
    var data = new FormData();
    var issue_id = $('#ticketDetailModal').data('issue-id')
    data.append("file", file);
    data.append("issue_id", issue_id);
    axios.post(attachments_url, payload=data)
        .then(response => {
            data = response['data']['data']
            target_tag.summernote('createLink', {
                text: file.name,
                url: data['url'],
                isNewWindow: true
            });
            addAttachmentIntoDOM(data);
            showNotify("SUCCESS", "Successfully uploaded");
        })
}

function moveButtonCallback(actionType){
    issue_id = $('#issue-id').data('issue-id');
    axios.get(action_types_url +'/'+ actionType)
    .then(response => {
        action_type_id = response.data['id']
        axios.post(actions_url, payload={
            "issue_id": issue_id,
            "action_type_id": action_type_id,
            "status": "NEW",
        })
        .then(response => {
            if ('msg' in response.data){
                showNotify("SUCCESS", response.data['msg']);
                return;
            }
            showNotify("SUCCESS", "Action has been added");
        })
        .catch(response => {
            if ('msg' in response.data){
                showNotify("ERROR", response.data['msg']);
                return;
            }
            showNotify("ERROR", "Error occured");
        })
    })
    .catch(response => console.log(response));
}

function addCommentIntoDOM(data){
    commentList = $('#comments-list')
    if (commentList.children().length==0){
        var text = `<hr>    
            <div class="container-fluid mt-4">
                <h5>Comments</h5>
                <div id="comments-list"></div>
            </div>`
        $('#comments-container').append(text);
        commentList = $('#comments-list');
    }
    date = moment(data['updated_at']).format('lll');
    var comment = `<div class="comment-widgets my-3" data-id="${data['id']}">
        <div class="d-flex flex-row comment-row">
            <div class="p-2"><span class="round"><img alt="user" width="50" src="${data['image_url']}"></span></div>
            <div class="comment-text w-100">
                <h6>${data['name']}</h6>
                <div class="comment-footer">
                <span class="date">${date}</span>
                <span class="action-icons"> 
                    <a class="mx-1 text-primary comment-edit" data-id="${data['id']}"><i class="fas fa-edit"></i></a> 
                    <a class="text-primary comment-delete" data-id="${data['id']}"><i class="fas fa-trash"></i></a> 
                    <a class="text-primary comment-save" data-id="${data['id']}" style="display:none"><i class="fas fa-save"></i></a>
                    <a class="text-primary comment-cancel" data-id="${data['id']}" style="display:none"><i class="fas fa-window-close"></i></a> 
                </span>
                </div>
                <div class="m-b-5 m-t-10 comment-content" data-id="${data['id']}">
                    ${data['comment']}
                </div>
            </div>
        </div>
    </div>
    `
    commentList.prepend(comment)
    $('.comment-delete').unbind()
    $('.comment-edit').unbind()
    $('.comment-delete').on('click', function(){
        commentDeleteRequest($(this).data('id'))
    });
    $('.comment-edit').on('click', function(){
        commentEdit($(this).data('id'))
    });
}

function commentDeleteRequest(id){
    $.ajax({
        url: comment_url + id,
        type: 'DELETE',
        success: function (response){
            $(`.comment-widgets[data-id="${id}"]`).remove()
            showNotify("SUCCESS", response.msg)
            if($('#comments-list').children().length==0){
                $('#comments-container').empty();
            }
        },
        error: function(response){
            let msg = response.responseJSON.msg;
            showNotify("ERROR", msg)
        },
        dataType: "json",
        contentType: "application/json"
    });
}

function commentEdit(id){
    $(`div.comment-content[data-id="${id}"]`).summernote({
        callbacks:{
            onImageUpload(files){
                sendFile(files[0], $(this));
            }
        }
    });
    var currentContent = $(`div.comment-content[data-id="${id}"]`).summernote('code');
    $(`a[data-id="${id}"]`).css("display", "none");
    $(`a.comment-save[data-id="${id}"]`).css("display", "inline");
    $(`a.comment-cancel[data-id="${id}"]`).css("display", "inline");
    $(`a.comment-cancel[data-id="${id}"]`).unbind()
    $(`a.comment-cancel[data-id="${id}"]`).one('click', function(){
        $(`div.comment-content[data-id="${id}"]`).summernote('code', currentContent);
        $(`div.comment-content[data-id="${id}"]`).summernote("destroy");
        $(`a[data-id="${id}"]`).css("display", "inline");
        $(`a.comment-save[data-id="${id}"]`).css("display", "none");
        $(`a.comment-cancel[data-id="${id}"]`).css("display", "none");
    });
    
    $(`a.comment-save[data-id="${id}"]`).unbind()
    $(`a.comment-save[data-id="${id}"]`).one('click', function(){
        comment =  $(`div.comment-content[data-id="${id}"]`).summernote('code');
        data = {"comment": comment}
        $.ajax({
            url: comment_url + id,
            type: 'PUT',
            data: JSON.stringify(data),
            success: function (response){
                $(`div.comment-content[data-id="${id}"]`).summernote("destroy");
                $(`a[data-id="${id}"]`).css("display", "inline");
                $(`a.comment-save[data-id="${id}"]`).css("display", "none");
                $(`a.comment-cancel[data-id="${id}"]`).css("display", "none");
                showNotify("SUCCESS", response.msg)
            },
            error: function(response){
                let msg = response.responseJSON.msg;
                showNotify("ERROR", msg)
            },
            dataType: "json",
            contentType: "application/json"
        });
    });
}

function populateComments(comments){
    if (comments.length>0){
        var text = `<hr>    
            <div class="container-fluid mt-4">
            <h5>Comments</h5>
            <div id="comments-list"></div>
            </div>`
        $('#comments-container').append(text);
    }
    $.each(comments, function(key, data){
        date = moment(data['updated_at']).format('lll');
        comment = `
            <div class="comment-widgets my-3" data-id=${data['id']}>
                <div class="d-flex flex-row comment-row">
                    <div class="p-2"><span class="round"><img alt="user" width="50" src="${data['image_url']}"></span></div>
                    <div class="comment-text w-100">
                        <h6>${data['name']}</h6>
                        <div class="comment-footer">
                        <span class="date">${date}</span>
                        <span class="action-icons"> 
                            <a class="text-primary comment-save" data-id="${data['id']}" style="display:none"><i class="fas fa-save"></i></a>
                            <a class="text-primary comment-cancel" data-id="${data['id']}" style="display:none"><i class="fas fa-window-close"></i></a>  
                        </span>
                        </div>
                        <div class="m-b-5 m-t-10 comment-content" data-id="${data['id']}">
                            ${data['comment']}
                        </div>
                    </div>
                </div>
            </div>
            `
        commentEditBtn = `<a class="mx-1 text-primary comment-edit" data-id="${data['id']}"><i class="fas fa-edit"></i></a>`
        commentDeleteBtn = `<a class="text-primary comment-delete" data-id="${data['id']}"><i class="fas fa-trash"></i></a>`
        $('#comments-list').append(comment);
        if (isOwner(data, 'author_id')){
            $(`.comment-widgets[data-id=${data['id']}] .action-icons`).append(commentEditBtn);
            $(`.comment-widgets[data-id=${data['id']}] .action-icons`).append(commentDeleteBtn);
        }
    });
    $('.comment-delete').on('click', function(){
        commentDeleteRequest($(this).data('id'))
    });
    $('.comment-edit').on('click', function(){
        commentEdit($(this).data('id'))
    });
}


function create_table_body(quayls_data){
    table = $('#issue-detail');
    $.each(quayls_data, function(key, value){
        if (key != 'attachments' && key != 'issue_logs' && key!="hash_id")
        {
            if (typeof value == "object"){
                $.each(value, function(key, value){
                    if (key=='source_id'){
                        row = create_link_row(key, value)
                    }
                    else {
                        row = create_row(key, value)
                    }
                    table.append(row)
                });
            }
            else
            {
                if (key=='asset_id'){
                    row = create_link_row(key, value)
                }
                else {
                    row = create_row(key, value)
                }
                table.append(row)
                if (key=='updated_at'){
                    key = 'without_processing'
                    timezone = new Date().getTimezoneOffset()
                    date_distance = Date.now()-Date.parse(value)+timezone*60*1000
                    count_day = parseInt(date_distance/(1000*60*60*24))
                    count_hour = parseInt(date_distance/(1000*60*60)%24)
                    count_minute = parseInt(date_distance/(1000*60)%60)
                    count_second = parseInt(date_distance/(1000)%60)
                    value = `${count_day} day ${count_hour}:${count_minute}:${count_second}`
                    row = create_row(key, value)
                    table.append(row)
                }
            }
        }
    });

    $('.asset_view').on('click', function(){
        // setting height of asset table
        $('#asset_col').height($('#issue-detail').height())

        let url = assets_url + '/' + $(this).data('asset_id');
        $('.detail-name h5').remove();
        $('.detail-name').append(`<h5>Asset id ${$(this).data('asset_id')}</h5>`)
        createDetailModal(url);
    });

    $('.source_view').on('click', function(){
        // setting height of source table
        $('#asset_col').height($('#issue-detail').height())

        let url = source_url + '/' + $(this).data('source_id');
        $('.detail-name h5').remove();
        $('.detail-name').append(`<h5>Source id ${$(this).data('source_id')}</h5>`)
        createDetailModal(url);
    });
}

function createDetailModal(url){
    $.get(url)
    .done(response => {
        create_detail_table_body(response);
        $("#ticketDetailModal").modal('show')
    });
}

function create_detail_table_body(data){
    $('#detail-table tr').remove();
    table = $('.table_detail');
    $.each(data, function(key, value){
        if (typeof value == "object"){
            $.each(value, function(key, value){
                row = create_row(key, value)
            });
        }
        else
        {
            row = create_row(key, value)
            table.append(row)
        }
    });
}

function create_link_row(field, value){
    capitilizedName = prepareFieldName(field)
    if (field=='asset_id'){
        value_td = `<a href='#' class='asset_view' data-${field}=${value}> ${value} </a>`
    }
    else if (field=='source_id'){
        value_td = `<a href='#' class='source_view' data-${field}=${value}> ${value} </a>`
    }
    return [
        '<tr id="issue-table-row">',
        `<th scope="row">${capitilizedName}</th>`,
        `<td id="issue-${field}" data-issue-${field}="${value}">${value_td}</td>`,
        '</tr>',
    ].join('')
}

function create_row(field, value){
    capitilizedName = prepareFieldName(field)
    return [
        '<tr id="issue-table-row">',
        `<th scope="row">${capitilizedName}</th>`,
        `<td id="issue-${field}" data-issue-${field}="${value}">${value}</td>`,
        '</tr>',
    ].join('')
}

function create_list_book(quayls_data){
    select = $('.form-select');
    select.empty();
    select.append('<option value=null>-</option>')
    axios.get(all_users_url)
    .then(response => {
        $.each(response.data, function(key, value){
            key = value['id']
            value = value['full_name']
            row = create_select(key, value, current_user_name)
            select.append(row)
        });
    })
}

function create_select(field, value, current_name){
    if (current_name==value){
        option = `<option selected value=${field}>${value}</option>`
    }
    else {
        option = `<option value=${field}>${value}</option>`
    }
    return [
        `${option}`
    ].join('')
}

function addAttachmentIntoDOM(attachment){
    var attachmentDOM = $('#attachments');
    if (attachmentDOM.children().length==0){
        var text = `<hr><div class="container-fluid">
                <div class="p-1">
                    <h5>Attachments</h5>
                    <div id="attachments">
                    </div>
                </div>
            </div>`
        $('#attachments-container').append(text);
        attachmentDOM = $('#attachments');
    }
    var date = moment(attachment['created_at']).format('lll');
    var text = `<div class="mb-1 attachment" data-id=${attachment['id']}>
        <div class="card">
            
            <div class="row no-gutters">
                <div class="col-4">
                    <a href="${attachment['url']}" target="_blank">
                        <img src="${attachment['url']}" 
                        class="card-img img-fluid"
                        id="attachment-img"
                        data-id="${attachment['id']}">
                    </a>
                </a>
                </div>

                <div class="col-8">
                    <div class="card-body">
                        <h6 class="card-title" data-id="${attachment['id']}" data-file-name="${attachment['file_name']}">
                            <strong>${attachment['file_name']}</strong>
                        </h6>
                        <p class="card-text">
                            Added at ${date} - 
                            <a href="#" class="attachment-comment" data-id="${attachment['id']}">Comment</a> 
                            <a href="#" class="attachment-delete" data-id="${attachment['id']}">Delete</a> 
                            <a href="#" class="attachment-edit" data-id="${attachment['id']}">Edit</a>
                            <a href="#" class="attachment-save" data-id="${attachment['id']}" style="display: none;">Save</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>`
    attachmentDOM.append(text);
    addEventHandlers();
}

function createLogs(logs){
    if (!logs || logs.length==0)
        return;
    
    var text = `<hr>
        <div class="container-fluid">
        <h5>Logs</h5>
        <ul id="logs-list">
        </ul>
        </div>`

    $('#logs-container').append(text);
    var logsListDOM = $('#logs-list');
    $.each(logs, function(key, log){
        date = moment(log['created_at']).format('lll');
        listItem = `<li><strong>${date}</strong> - <strong>${log['user_full_name']}</strong> ${log['title']} </li>`
        logsListDOM.append(listItem);
    });
}

function opened_by(issue_id, username){
    let list_id = `opened-list-${issue_id}`
    let header = `<hr>
        <div class="container-fluid">
            <h5>Opened now by:</h5>
            <ul id=${list_id}></ul>
        </div>`;

    $('#opened-by').append(header);
    socket.on("user_open_check", (data) => {
        let user_id = `user-${data.id}-${data.user}`
        if ($(`#${user_id }`).length){
        }
        else{
            listItem = `<li id=${user_id}></li>`
            $(`#${list_id}`).append(listItem);
            username = `<strong>${data.user}</strong>`
            $(`#${user_id }`).append(username);
        }
    });

}

function createAttachments(attachments){
    if (!attachments || attachments.length==0)
        return;
    
    var text = `<div class="container-fluid">
                <div class="p-1">
                    <h5>Attachments</h5>
                    <div id="attachments">
                    </div>
                </div>
                </div>`

    $('#attachments-container').append(text);

    var attachmentDOM = $('#attachments');
    $.each(attachments, function(key, attachment){
        date = moment(attachment['created_at']).format('lll');
        text = `<div class="mb-1 attachment" data-id="${attachment['id']}">
            <div class="card">
                
                <div class="row no-gutters">
                    <div class="col-4">
                        <a href="${attachment['url']}" target="_blank">
                            <img src="${attachment['url']}" 
                            class="card-img img-fluid"
                            id="attachment-img"
                            data-id="${attachment['id']}">
                        </a>
                    </div>

                    <div class="col-8">
                        <div class="card-body">
                            <h6 class="card-title" data-id="${attachment['id']}" data-file-name="${attachment['file_name']}">
                                <strong>
                                    ${attachment['file_name']}
                                </strong>
                            </h6>
                            <p class="card-text">
                                Added at ${date} - 
                                <a href="#" class="attachment-comment" data-id="${attachment['id']}">Comment</a> 
                                <a href="#" class="attachment-delete" data-id="${attachment['id']}">Delete</a> 
                                <a href="#" class="attachment-edit" data-id="${attachment['id']}">Edit</a>
                                <a href="#" class="attachment-save" data-id="${attachment['id']}" style="display: none;">Save</a>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>`
        attachmentDOM.append(text);
    });
    addEventHandlers();
}

function addEventHandlers(){
    $('.attachment-comment').unbind('click')
    $('.attachment-delete').unbind('click')
    $('.attachment-edit').unbind('click')

    $('.attachment-comment').on('click', function(e){
        id = $(this).data('id');
        url = $(`img#attachment-img[data-id="${id}"]`).attr('src');
        file_name = $(`h6.card-title[data-id="${id}"]`).data('file-name');
        $('#comment-textarea').summernote('createLink', {
            text: file_name,
            url: url,
            isNewWindow: true
        });
        $("#comment-textarea").summernote("focus");
    });

    $('.attachment-delete').on('click', function(){
        id = $(this).data('id');
        $.ajax({
            url: attachmentUrl + id,
            type: 'DELETE',
            statusCode: {
                404: function(responseObject, textStatus, jqXHR) {
                    $(`.attachment[data-id=${id}]`).remove()
                },
         
            },
            success: function (response){
                $(`.attachment[data-id=${id}]`).remove()
                if($('#attachments').children().length==0){
                    $('#attachments-container').empty();
                }
                showNotify("SUCCESS", response.msg)
            },
            error: function(response){
                let msg = response.responseJSON.msg;
                showNotify("ERROR", msg)
            },
            dataType: "json",
            contentType: "application/json"
        });
    });

    $('.attachment-edit').on('click', function(e){
        id = $(this).data('id');
        // toggling buttons
        $(this).css('display', 'none');
        $(`.attachment-delete[data-id=${id}]`).css('display', 'none');
        $(`.attachment-comment[data-id=${id}]`).css('display', 'none');
        $(`.attachment-save[data-id=${id}]`).css('display', 'inline');        

        // inserting textarea field in place of h6 tag
        headerDOM = $(`h6.card-title[data-id="${id}"]`);
        file_name = headerDOM.data('file-name');
        headerDOM.empty();
        headerDOM.replaceWith(`
            <input type="text" class="form-control attachment-name" value="${file_name}" data-id="${id}">
        `)
    });

    $('.attachment-save').on('click', function(){
        id = $(this).data('id');
        
        // toggle buttons back
        $(this).css('display', 'none');
        $(`.attachment-delete[data-id=${id}]`).css('display', 'inline');
        $(`.attachment-comment[data-id=${id}]`).css('display', 'inline');
        $(`.attachment-edit[data-id=${id}]`).css('display', 'inline');
        
        // making update request to backend
        file_name = $(`input.attachment-name[data-id=${id}]`).val();
        $.ajax({
            url: attachmentUrl + id,
            type: 'PUT',
            data: JSON.stringify({"file_name": file_name}),
            success: function (response){
                // replacing input tag with h6
                $(`input.attachment-name[data-id=${id}]`).replaceWith(`
                    <h6 class="card-title" data-id="${id}" data-file-name="${file_name}">
                        <strong>
                            ${file_name}
                        </strong>
                    </h6>  
                `);
                showNotify("SUCCESS", response.msg)
            },
            error: function(response){
                let msg = response.responseJSON.msg;
                showNotify("ERROR", msg)
            },
            dataType: "json",
            contentType: "application/json"
        });
    });
}

function prepareFieldName(field){
    subNames = field.split('_')
    subNames = subNames.map(name => name.toUpperCase())
    field = subNames.join(' ')
    return field
}

function isOwner(object, user_lookup){
    let isAdminUser = vueVm.registered_components.isAdmin;
    let userId = vueVm.registered_components.navbar.user.id
    if (isAdminUser) return true
    return object[user_lookup] == userId;
}