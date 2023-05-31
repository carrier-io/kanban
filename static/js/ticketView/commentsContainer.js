const TicketCommentsContainer = {
    props: ["ticket"],
    watch: {
        async ticket(){
            await this.fetchComments()
        } 
    },
    async mounted() {
        if (!this.ticket)
            return
        await this.fetchComments()
    },
    data() {
        return {
            comments: [],
            isCommenting: false,
        }
    },
    computed: {
        url(){
            return comments_url + this.ticket.id
        },
    },
    methods: {
        async fetchComments(){
            response = await axios.get(this.url)
            this.SET_COMMENTS(response.data['items'])
        },

        SET_COMMENTS(comments){
            this.comments = comments
        },

        ADD_COMMENT(comment){
            this.comments.push(comment)
        },

        REMOVE_COMMENT(id){
            ind = this.comments.findIndex(comment => comment.id == id)
            this.comments.splice(ind, 1)
        },

        UPDATE_COMMENT(id, comment){
            ind = this.comments.findIndex(comment => comment.id == id);
            this.comments[ind]['comment'] = comment.comment;
        },

        showAction(event){
            event.target.querySelector('.comment-actions')?.classList.add('d-flex')
        },

        hideAction(event){
            event.target.querySelector('.comment-actions')?.classList.remove('d-flex')
        },

        openCommentField(){
            this.isCommenting = true;
            $('.comment-textarea').css("display", 'flex')  
            $('#comment-textarea').summernote({
                height: 150,
                focus: true,
            });
        },

        closeCommentField(){
            this.isCommenting = false
            $('.comment-textarea').css("display", 'none')  
            $('#comment-textarea').summernote('reset');
        },

        postComment(){
            isNotEmpty = !$('#comment-textarea').summernote('isEmpty')
            if(isNotEmpty){
                comment = $("#comment-textarea").summernote('code')
                axios.post(comments_url+this.ticket.id, payload={"comment": comment})
                    .then(response => {
                        this.ADD_COMMENT(response.data['item'])
                        this.closeCommentField()
                    })
            }            

        },

        deleteComment(event){
            id = event.target.dataset['id']
            axios.delete(comment_url + id)
                .then(() => {
                    this.REMOVE_COMMENT(id)
                    showNotify("SUCCESS", "Successfuly deleted")
                })
                .catch(err => {
                    console.log(err)
                    showNotify("ERROR")
                })
        },

        openEditComment(event){
            id = event.target.dataset['id']
            $(`.value[data-id=${id}]`).summernote()
            $(`.comment-wrapper[data-id=${id}]`).css('border', '1px solid #EAEDEF')
            $(`.edit-btn-container[data-id=${id}]`).css('display', 'flex')
        },

        closeEditCommentField(){
            $(`.value[data-id=${id}]`).summernote('destroy')
            $(`.comment-wrapper[data-id=${id}]`).css('border', '')
            $(`.edit-btn-container[data-id=${id}]`).css('display', 'none')
        },

        closeEditComment(event){
            id = event.target.dataset['id']
            comment = this.comments.find(comment => comment.id==id)
            this.closeEditCommentField()
            $(`.comment-wrapper[data-id=${id}] .value[data-id=${id}]`).empty()
            $(`.comment-wrapper[data-id=${id}] .value[data-id=${id}]`).append(comment.comment)
        },

        editComment(event){
            id = event.target.dataset['id']
            comment =  $(`.comment-wrapper[data-id=${id}] .value[data-id=${id}]`).summernote('code');
            axios.put(comment_url+id, payload={"comment": comment})
            .then(resp => {
                this.UPDATE_COMMENT(id, resp.data['item'])
                this.closeEditCommentField()
                showNotify("SUCCESS", "Successfully commented")
            })
            .catch(err => {
                console.log(err)
            })
        },

        formatDate(dateStr){
            addLeadingZero  = number => number < 10 ? '0' + number: `${number}`
            date = new Date(dateStr)
            day = addLeadingZero(date.getDate());
            year = date.getFullYear()
            month = addLeadingZero(date.getMonth())
            hour = addLeadingZero(date.getHours())
            minute = addLeadingZero(date.getMinutes())
            return `${day}.${month}.${year}  ${hour}:${minute}`
        },

        displayCommentTime(dateStr){
            dateStr = dateStr + "Z"
            date = new Date(dateStr)
            minutes = Math.round((Date.now() - date) / 60000)
            if (minutes <= 1)
                return "Just now"
            return this.formatDate(dateStr)
        }

    },
    template: `<div class="comments-container">
        <div class="title-row">
            <div class="label">
                Comments
            </div>
        </div>

        <div v-for="comment in comments" 
                :key="comment.id" 
                class="comment" 
                @mouseover="showAction"  
                @mouseleave="hideAction"
            >
            <div class="comment-details">
                <div class="comment-user">
                    <div class="avatar-icon">
                        <img :src="comment.image_url">
                    </div>
                    <div class="avatar-desc">
                        <div class="user-name">{{ comment.name }}</div>
                        <div class="time">{{displayCommentTime(comment.updated_at)}}</div>
                    </div>
                </div>

                <div class="comment-actions mr-4">
                    <i @click="openEditComment" class="icon__18x18 icon-edit mr-2" :data-id="comment.id"></i>
                    <i @click="deleteComment" class="icon__18x18 icon-delete" :data-id="comment.id"></i>
                </div>
            </div>

            <div class="comment-wrapper mr-4" :data-id="comment.id">
                <div class="value" v-html="comment.comment" :data-id="comment.id">
                </div>

                <div class="edit-btn-container" :data-id="comment.id">
                    <button :data-id="comment.id" class="btn btn-sm btn-basic mr-2" @click="editComment">Edit</button>
                    <button :data-id="comment.id" class="btn btn-sm btn-secondary" @click="closeEditComment">Cancel</button>
                </div>
            </div>
            
        </div>

        <div v-if="!isCommenting" class="d-flex justify-content-center align-items-center" @click="openCommentField">
            <i class="icon__16x16 icon-plus__16 mr-1" style="background: #2772E2"></i>
            <span class="blue-link  mr-2">Comment</span>
        </div>

        <div class="comment-textarea mr-4">
            <div id="comment-textarea">
            </div>
            <div class="comment-btn-container">
                <button class="btn btn-sm btn-basic mr-2" @click="postComment">Post</button>
                <button class="btn btn-sm btn-secondary" @click="closeCommentField">Cancel</button>
            </div>
        </div>

    </div>
    ` 
}


