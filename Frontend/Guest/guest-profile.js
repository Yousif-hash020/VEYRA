const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || !user || user.role !== "guest") {
    window.location.href = "/Frontend/auth.html";
}



let getProfile = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/rooms",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );
    
    const data = await response.json();
    }catch(error){
        console.error(error)
    }

};