let revealToggle = {
    revealState: true,
    element: null,
    setState(isActive){
        if (isActive) {
            this.element.classList.remove("js-deactivated");
        } else {
            this.element.classList.add("js-deactivated");
        }
    },
    set state(value){
        this.revealState = value;
        this.setState(value);
    },
};
function onRestart(callback){
    let restart = document.querySelector(".settings__restart");
    restart.addEventListener("click", function(event){
        event.preventDefault();
        callback();
    });
}
function onRevealCount(callback){
    revealToggle.element = document.querySelector(".settings__revealCount");
    let slider = revealToggle.element.querySelector(".settings__slider");
    revealToggle.element.addEventListener("click", function(event){
        event.preventDefault();
        if (!revealToggle.revealState) {
            return;
        }
        slider.classList.toggle("js-one");
        let count = slider.classList.contains("js-one") ? 1 : 3;
        callback(count);
    });
    return revealToggle;
}
export {onRestart, onRevealCount};