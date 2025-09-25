// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

// ====== Configuración Firebase ======
const firebaseConfig = {
    apiKey: "AIzaSyDY17ep_S0mHigcF98t3NX-J6NRzlp-PxM",
    authDomain: "gymheroes-edf03.firebaseapp.com",
    projectId: "gymheroes-edf03",
    storageBucket: "gymheroes-edf03.firebasestorage.app",
    messagingSenderId: "122229221912",
    appId: "1:122229221912:web:1471587cbaf4685f90b16d",
    measurementId: "G-8E8SK69SYT"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ====== Colección de practicantes ======
const practicantesRef = collection(db, "practicantes");

// ====== VARIABLES GLOBALES ======
const addFormSection = document.getElementById("add-practicante-section");
const showAddFormButton = document.getElementById("show-add-form-button");
const hideAddFormButton = document.getElementById("hide-add-form-button");
const practicanteForm = document.getElementById("practicante-form");
const disciplinaSelect = document.getElementById("disciplina");
const gradoSelect = document.getElementById("grado");
const fotoInput = document.getElementById("foto-input");
const photoPreview = document.getElementById("photo-preview");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

// Listas
const listaITF = document.getElementById("lista-practicantes-itf");
const listaKombat = document.getElementById("lista-practicantes-kombat");
const listaProfesores = document.getElementById("lista-profesores");

// Grados por disciplina
const gradosITF = ["Cinturón Blanco","Cinturón Amarillo","Cinturón Verde","Cinturón Azul","Cinturón Rojo","Cinturón Negro"];
const gradosKombat = ["Novato","Principiante","Intermedio","Avanzado","Experto"];

// ====== FUNCIONES ======

// Mostrar/ocultar formulario
if (showAddFormButton) showAddFormButton.addEventListener("click", () => addFormSection.classList.remove("hidden-form"));
if (hideAddFormButton) hideAddFormButton.addEventListener("click", () => {
    addFormSection.classList.add("hidden-form");
    practicanteForm.reset();
    photoPreview.src = "#";
});

// Cambiar opciones de grado según disciplina
if (disciplinaSelect) {
    disciplinaSelect.addEventListener("change", () => {
        gradoSelect.innerHTML = "";
        let selected = disciplinaSelect.value;
        let grados = selected === "itf" ? gradosITF : selected === "kombat" ? gradosKombat : [];
        grados.forEach(grado => {
            let option = document.createElement("option");
            option.value = grado;
            option.textContent = grado;
            gradoSelect.appendChild(option);
        });
        gradoSelect.disabled = grados.length === 0;
    });
}

// Vista previa de foto
if (fotoInput) fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = ev => photoPreview.src = ev.target.result;
        reader.readAsDataURL(file);
    }
});

// Guardar o actualizar practicante
if (practicanteForm) practicanteForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        dni: document.getElementById("dni").value,
        genero: document.getElementById("genero").value,
        fechaNacimiento: document.getElementById("fecha-nacimiento").value,
        pais: document.getElementById("pais").value,
        email: document.getElementById("email").value,
        peso: parseFloat(document.getElementById("peso").value) || null,
        altura: parseFloat(document.getElementById("altura").value) || null,
        disciplina: document.getElementById("disciplina").value,
        grado: document.getElementById("grado").value,
        licencia: document.getElementById("licencia").value,
        fechaCaducidad: document.getElementById("fecha-caducidad").value,
        rol: document.querySelector('input[name="rol"]:checked').value,
        fotoUrl: ""
    };

    try {
        if(fotoInput.files[0]){
            const storageRef = ref(storage, `fotos/${Date.now()}_${fotoInput.files[0].name}`);
            await uploadBytes(storageRef, fotoInput.files[0]);
            data.fotoUrl = await getDownloadURL(storageRef);
        }

        const idInput = document.getElementById("practicante-id");
        if(idInput.value){
            const docRef = doc(db, "practicantes", idInput.value);
            await updateDoc(docRef, data);
        } else {
            await addDoc(practicantesRef, data);
        }

        alert("Practicante guardado correctamente");
        practicanteForm.reset();
        addFormSection.classList.add("hidden-form");
        location.reload();
    } catch(err){
        console.error(err);
        alert("Error al guardar practicante");
    }
});

// Cargar lista de practicantes
const loadPracticantes = async (filter="all", search="") => {
    [listaITF, listaKombat, listaProfesores].forEach(list => { if(list) list.innerHTML = ""; });

    const snapshot = await getDocs(practicantesRef);
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const fullName = `${data.nombre} ${data.apellido}`.toLowerCase();
        const dni = data.dni.toLowerCase();
        const id = docSnap.id.toLowerCase();
        const discipline = data.disciplina.toLowerCase();

        if(search && !fullName.includes(search.toLowerCase()) && !dni.includes(search.toLowerCase()) && !id.includes(search.toLowerCase())) return;
        if(filter !== "all" && discipline !== filter) return;

        const li = document.createElement("li");
        li.classList.add("practicante-item");
        li.innerHTML = `
            <img src="${data.fotoUrl || "img/default-user.png"}" alt="${data.nombre}">
            <div class="info">
                <h4>${data.nombre} ${data.apellido}</h4>
                <p>${data.disciplina || ""} - ${data.grado || ""}</p>
                <button onclick="window.location.href='detalle-practicante.html?id=${docSnap.id}'" class="action-button primary">Ver detalle</button>
            </div>
        `;

        if(data.rol==="profesor" && listaProfesores) listaProfesores.appendChild(li);
        else if(discipline==="itf" && listaITF) listaITF.appendChild(li);
        else if(discipline==="kombat" && listaKombat) listaKombat.appendChild(li);
    });
};

// Inicializar lista completa
if(listaITF) loadPracticantes();

// Filtros
document.querySelectorAll(".filter-itf, .filter-kombat").forEach(btn => {
    btn.addEventListener("click", () => {
        const disc = btn.dataset.discipline;
        loadPracticantes(disc);
    });
});

// Búsqueda
if(searchButton) searchButton.addEventListener("click", () => {
    const search = searchInput.value.trim();
    loadPracticantes("all", search);
});

// ====== DETALLE PRACTICANTE ======
const urlParams = new URLSearchParams(window.location.search);
const practicanteId = urlParams.get("id");

if(practicanteId && document.getElementById("detail-nombre-completo")){
    const loadDetail = async () => {
        const docRef = doc(db, "practicantes", practicanteId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()){
            const data = docSnap.data();
            document.getElementById("detail-nombre-completo").textContent = `${data.nombre} ${data.apellido}`;
            document.getElementById("detail-id").textContent = practicanteId;
            document.getElementById("detail-dni").textContent = data.dni;
            document.getElementById("detail-genero").textContent = data.genero;
            document.getElementById("detail-fecha-nacimiento").textContent = data.fechaNacimiento;
            document.getElementById("detail-email").textContent = data.email;
            document.getElementById("detail-pais").textContent = data.pais;
            document.getElementById("detail-peso").textContent = data.peso || "";
            document.getElementById("detail-altura").textContent = data.altura || "";
            document.getElementById("detail-disciplina").textContent = data.disciplina;
            document.getElementById("detail-grado").textContent = data.grado;
            document.getElementById("detail-licencia").textContent = data.licencia;
            document.getElementById("detail-fecha-caducidad").textContent = data.fechaCaducidad;
            document.getElementById("detail-photo").src = data.fotoUrl || "img/default-user.png";
        } else alert("Practicante no encontrado");
    };
    loadDetail();
}
