import getCards from "https://bqardi.github.io/cards/api/card.js";

let cardsShuffled = document.querySelector(".cards__shuffled");
let cardsTurned = document.querySelector(".cards__turned");

let fields = [];
let cardObj;

document.querySelectorAll(".cards__field").forEach(element => {
    fields.push(createField(element));
});

getCards(function(cards){
    cards.shuffleDeck();
    let deck = createCard(cards.back.blue.image);
    
    cardsShuffled.appendChild(deck);
    
    deck.addEventListener("click", function(){
        let drawn = cards.draw();
        let card = createCard(drawn.image);
        card.draggable = true;
        card.id = drawn.id;
        card.addEventListener("dragstart", drag);
        cardsTurned.appendChild(card);
        if (cards.deck.length === 0) {
            cardsShuffled.innerHTML = "";
        }
    });
    cardObj = cards;
});

function createCard(imgSrc){
    let card = document.createElement("DIV");
    card.classList.add("card");
    card.dataset.locked = false;
    
    let img = document.createElement("IMG");
    img.src = imgSrc;
    img.classList.add("card__image");

    card.appendChild(img);

    return card;
}

function createField(element){
    element.addEventListener("dragover", function(event){
        event.preventDefault();
    });
    element.addEventListener("drop", drop);
    return {
        id: element.id,
        element,
        cards: [],
        isEmpty: true,
        isAces: element.classList.contains("cards__ace"),
        addCard(card){
            this.updateLastCard(true);
            this.lockCard(card, false);
            this.cards.push(card);
            card.removeAttribute("style");
            if (this.isEmpty) {
                card.classList.remove("js-abovecard");
                this.isEmpty = false;
            } else {
                card.classList.add("js-abovecard");
                if (this.element.classList.contains("cards__table")) {
                    card.style.top = `${this.cards.length * 3 - 3}vw`;
                }
            }
            this.element.appendChild(card);
        },
        removeLastCard(){
            this.cards.pop();
            this.updateLastCard();
        },
        lastCard(){
            return this.cards[this.cards.length - 1] || null;
        },
        updateLastCard(isLocked){
            if (this.cards.length === 0) {
                this.isEmpty = true;
            } else {
                this.lockCard(this.cards[this.cards.length - 1], isLocked);
            }
        },
        lockCard(card, isLocked){
            card.dataset.locked = isLocked;
        }
    }
}

function drag(event){
    event.dataTransfer.setData("text", event.currentTarget.id);
}

function drop(event){
    event.preventDefault();
    let field = fields.find(obj => obj.id === event.currentTarget.id);
    let data = event.dataTransfer.getData("text");
    let card = document.getElementById(data);
    let lastCard = field.lastCard();
    if (lastCard) {
        let currentCardObj = cardObj.findCard(card.id);
        let cardInFieldObj = cardObj.findCard(lastCard.id);
        if (field.isAces) {
            if (currentCardObj.suit !== cardInFieldObj.suit || currentCardObj.value !== cardInFieldObj.value + 1) {
                return;
            }
        } else {
            if (currentCardObj.color === cardInFieldObj.color || currentCardObj.value !== cardInFieldObj.value - 1) {
                return;
            }
        }
    }
    if (card.dataset.field) {
        let prevField = fields.find(obj => obj.id === card.dataset.field);
        if (card.dataset.locked === "true") {
            return;
        } else {
            prevField.removeLastCard();
        }
    }
    card.setAttribute("data-field", field.id);
    field.addCard(card);
}