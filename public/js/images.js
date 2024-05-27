// Array of image URLs
var images = ["images/dancer.jpg", "images/logo.png", "images/company-images/company-logo1.png"]; // Add as many image URLs as needed
var head = ["hello", "can" , "you"];
var price = ["100", "12", "22"];
// Function to create a card element with a responsive image
// Function to create a card element with a responsive image
function createCard(imageUrl, title, price) {
    // Create card container
    var card = document.createElement("div");
    card.classList.add("card");
    card.classList.add("center");

    var content = document.createElement("div");
    content.classList.add("card-content");
    
    // Create responsive image element
    var img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Product";
    img.classList.add("responsive-image");

    // Create title element
    var titleElement = document.createElement("h1");
    titleElement.textContent = title;

    // Create price element
    var priceElement = document.createElement("p");
    priceElement.textContent = "Price: $" + price;

    // Append elements to content
    content.appendChild(titleElement);
    content.appendChild(priceElement);

    // Append image and content to card
    card.appendChild(img);
    card.appendChild(content);

    // Append card to container
    document.getElementById("cardContainer").appendChild(card);
}

// Loop through the images array and create cards for each image
for (var i = 0; i < images.length; i++) {
    createCard(images[i], head[i], price[i]);
}