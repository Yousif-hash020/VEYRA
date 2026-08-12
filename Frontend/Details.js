let detail = document.querySelector(".details");
const container = document.querySelector("#property-container");


let details = async () => {
    const response = await fetch("http://localhost:5000/api/rooms/", {
        method: "GET",
    });

    const data = await response.json();
    console.log(data);

    data.data.forEach(element => {
       let names = document.createElement("h1");
       names.textContent = element.name;

       let owr = document.createElement("h3");
       console.log(owr.textContent = ` Host ${element.owner.name}`);

       document.querySelector("#property-container").appendChild(names);
       document.querySelector("#property-container").appendChild(owr);
    });

}

details();
