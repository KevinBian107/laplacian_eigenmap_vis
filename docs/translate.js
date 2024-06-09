function showTranslateOptions() {
    var translateElement = document.getElementById('google_translate_element');
    if (translateElement.style.display === 'block') {
        translateElement.style.display = 'none';
    } else {
        translateElement.style.display = 'block';
    }
}