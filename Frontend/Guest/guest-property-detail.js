const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}


let getDetails= async ()=>{
    try {
        const response = await fetch("http://localhost:5000/api/guest/properties/:id", {
            method:"GET",
            headers:{
                "Authorizzation": `Bearer ${token}`
            }
        });

        const data = await response.json();

        console.log(data);
    } catch (error) {
        console.error(error, "Error")
    }
}