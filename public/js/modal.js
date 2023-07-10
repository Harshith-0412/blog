// Open the modal when "Add Comment" button is clicked
$('#add-comment-btn').click(function() {
    $('#comments-modal').css('display', 'block');
  });
  
  // Close the modal when the close button or outside the modal is clicked
  $('.close, .modal').click(function(event) {
    if (event.target === this) {
      $('#comments-modal').css('display', 'none');
    }
  });
  
  // Prevent clicks inside the modal from closing the modal
  $('.modal-content').click(function(event) {
    event.stopPropagation();
  });
  