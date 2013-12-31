$(document).ready(function() {
	function common_validate(obj, condition1) {
		if (condition1) {
			obj.val('');
			obj.attr('placeholder', obj.data('warning')).removeClass('okay');
			obj.parent().addClass('has-error');
		} else {
			obj.addClass('okay');
		}
	}

	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	$('.validate').focusout(function(){
		var id = $(this).attr('id');
		if (id == 'name' || id == 'title') {
			common_validate($(this), $(this).val()=='');
		} else if (id == 'password') {
			common_validate($(this), $(this).val().length < 6);
		} else if (id == 'repeat_psw') {
			var $password = $('#password').val();
			common_validate($(this), $(this).val() !== $password);
		} else if (id == 'email') {
			common_validate($(this), !validateEmail($(this).val()));
		}
	});

	$('.validate').focus(function(){
		$(this).parent().removeClass('has-error');
		$(this).attr('placeholder', $(this).data('placeholder'));
	});

	$('#password, #email, #repeat_psw').focus(function() {
		$(this).parent().siblings('h3').hide();
	});

	$('input.validate').focusout(function() {
		flag = 'true';
		$('input.validate').each(function(){
			if (!$(this).hasClass('okay')) {
				flag = 'false';
			}
		});
		if (flag == 'true') {
			$('button.validate').removeClass('disabled');
			$('button.validate').removeAttr('disabled');
		}
	});

	$(function(){
		$('ul.navbar-nav li a').each(function(){
			if ($(this).attr('href') == window.location.pathname) {
				$(this).parent('li').addClass('active animated tada');
			}
		});
		var $container = $('#posts');
		$container.masonry({
			itemSelector: '.single-post',
			isResizable: true,
			columnWidth: 1
		});
		$container.sortable({
			distance: 12,
			items: '.single-post',
			forcePlaceholderSize: true,
			placeholder: 'post-sortable-placeholder single-post',
	        tolerance: 'pointer',
			start: function (e, ui) {
				console.info(ui.item.parent());
				ui.item.addClass('dragging').removeClass('single-post');
				ui.item.parent().masonry('destroy').masonry();
			},
			change: function (e, ui) {
				ui.item.parent().masonry('destroy').masonry();
			},
			stop: function (e, ui) {
				ui.item.addClass('single-post').removeClass('dragging');
				ui.item.parent().masonry('destroy').masonry();
			}
		});
	});

	$('.single-post .close').click(function(){
		var $container = $('#posts');
		$container.masonry('remove', $(this).parents('.single-post'));
		$container.masonry();
	})

	$('.nav li').hover(function(){
		$(this).addClass('animated swing');
	}, function(){
		$(this).removeClass('animated swing');
	});
});