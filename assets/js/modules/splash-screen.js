let splashTimeout;
function splashScreen(timeout){
    splashTimeout = setTimeout(closeSplashScreen, timeout);
}
function closeSplashScreen(){
    clearTimeout(splashTimeout);
    document.querySelector(".overlay").style.display = "none";
}
export {splashScreen, closeSplashScreen};