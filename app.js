const API_KEY = 'AQUI COLOCAS TU API, YO USE UNA API DE GEMINI';
const URL_API = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

const ICONOS_IMAGENES = [
    'hongo.png', 
    'fantasma.png', 
    'elefante.png', 
    'brujita.png',
    'demonio.png',
    'calabaza.png'
];

let chats = JSON.parse(localStorage.getItem('gemini_chats')) || [];
let chatActualId = null;

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatList = document.getElementById('chatList');
const sidebar = document.getElementById('sidebar');

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') enviarMensaje();
});

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

function inicializar() {
    if (chats.length === 0) {
        crearNuevoChat();
    } else {
        cargarChat(chats[0].id);
    }
    renderizarListaChats();
}

function crearNuevoChat() {
    const iconoAleatorio = ICONOS_IMAGENES[Math.floor(Math.random() * ICONOS_IMAGENES.length)];
    
    const nuevoChat = {
        id: 'chat_' + Date.now(),
        titulo: 'Nuevo chat',
        icono: iconoAleatorio,
        historial: []
    };
    chats.unshift(nuevoChat);
    guardarChats();
    cargarChat(nuevoChat.id);
    renderizarListaChats();
}

function borrarChat(id, event) {
    event.stopPropagation();
    chats = chats.filter(c => c.id !== id);
    guardarChats();

    if (chats.length === 0) {
        crearNuevoChat();
    } else if (chatActualId === id) {
        cargarChat(chats[0].id);
    } else {
        renderizarListaChats();
    }
}

function activarEdicionNombre(id, event) {
    event.stopPropagation();
    const chatItem = document.getElementById(`item-${id}`);
    if (!chatItem) return;

    const chat = chats.find(c => c.id === id);
    const titleSpan = chatItem.querySelector('.chat-title');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-title-input';
    input.value = chat.titulo;
    
    titleSpan.replaceWith(input);
    input.focus();
    input.select();

    const guardarCambio = () => {
        const nuevoTexto = input.value.trim();
        if (nuevoTexto) {
            chat.titulo = nuevoTexto;
            guardarChats();
        }
        renderizarListaChats();
    };

    input.addEventListener('blur', guardarCambio);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') guardarCambio();
    });
}

function cargarChat(id) {
    chatActualId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    chatMessages.innerHTML = '';
    
    if (chat.historial.length === 0) {
        agregarMensajeUI('¡Hola! ¿De qué quieres hablar hoy?', 'ai');
    } else {
        chat.historial.forEach(msg => {
            const rolUI = msg.role === 'user' ? 'user' : 'ai';
            const texto = msg.parts[0].text;
            if (rolUI === 'ai') {
                agregarMensajeUIConMarkdown(texto, 'ai');
            } else {
                agregarMensajeUI(texto, 'user');
            }
        });
    }
    renderizarListaChats();
}

function renderizarListaChats() {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const div = document.createElement('div');
        div.id = `item-${chat.id}`;
        div.className = `chat-item ${chat.id === chatActualId ? 'active' : ''}`;
        div.onclick = () => cargarChat(chat.id);
        div.ondblclick = (e) => activarEdicionNombre(chat.id, e);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'chat-info';

        const iconoImg = document.createElement('img');
        iconoImg.className = 'chat-icon-img';
        iconoImg.src = chat.icono || 'hongo.png';
        iconoImg.alt = 'Icono';
        iconoImg.onerror = function() { 
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23ba5491"/></svg>'; 
        };

        const spanTitulo = document.createElement('span');
        spanTitulo.className = 'chat-title';
        spanTitulo.innerText = chat.titulo;

        infoDiv.appendChild(iconoImg);
        infoDiv.appendChild(spanTitulo);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-actions';

        const btnRenombrar = document.createElement('button');
        btnRenombrar.className = 'action-btn';
        btnRenombrar.innerHTML = '✏️';
        btnRenombrar.title = 'Cambiar nombre';
        btnRenombrar.onclick = (e) => activarEdicionNombre(chat.id, e);

        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'action-btn delete-btn';
        btnEliminar.innerHTML = '✕';
        btnEliminar.title = 'Borrar chat';
        btnEliminar.onclick = (e) => borrarChat(chat.id, e);

        actionsDiv.appendChild(btnRenombrar);
        actionsDiv.appendChild(btnEliminar);

        div.appendChild(infoDiv);
        div.appendChild(actionsDiv);
        chatList.appendChild(div);
    });
}

function guardarChats() {
    localStorage.setItem('gemini_chats', JSON.stringify(chats));
}

async function enviarMensaje() {
    const texto = userInput.value.trim();
    if (!texto) return;

    const chatActual = chats.find(c => c.id === chatActualId);
    if (!chatActual) return;

    if (chatActual.historial.length === 0) {
        chatActual.titulo = texto.length > 22 ? texto.substring(0, 22) + '...' : texto;
    }

    agregarMensajeUI(texto, 'user');
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    chatActual.historial.push({
        role: "user",
        parts: [{ text: texto }]
    });
    guardarChats();
    renderizarListaChats();

    const idAI = 'msg-' + Date.now();
    const divAI = document.createElement('div');
    divAI.className = 'message ai';
    divAI.id = idAI;
    divAI.innerHTML = '<em>Pensando...</em>';
    chatMessages.appendChild(divAI);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const respuesta = await fetch(URL_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatActual.historial })
        });

        if (!respuesta.ok) throw new Error('Error en la comunicación con la API');

        const reader = respuesta.body.getReader();
        const decoder = new TextDecoder();
        let textoCompleto = "";
        let primerChunk = true;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lineas = chunk.split('\n');
            
            for (const linea of lineas) {
                if (linea.startsWith('data: ')) {
                    const jsonStr = linea.replace('data: ', '').trim();
                    if (jsonStr) {
                        const data = JSON.parse(jsonStr);
                        if (data.candidates && data.candidates[0].content) {
                            const parteTexto = data.candidates[0].content.parts[0].text;
                            if (primerChunk) {
                                textoCompleto = "";
                                primerChunk = false;
                            }
                            textoCompleto += parteTexto;
                            divAI.innerHTML = marked.parse(textoCompleto);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
                    }
                }
            }
        }

        chatActual.historial.push({
            role: "model",
            parts: [{ text: textoCompleto }]
        });
        guardarChats();

    } catch (error) {
        document.getElementById(idAI).innerText = 'Lo siento, ocurrió un error de red.';
        console.error(error);
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}

function agregarMensajeUI(texto, clase) {
    const div = document.createElement('div');
    div.className = `message ${clase}`;
    div.innerText = texto;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function agregarMensajeUIConMarkdown(texto, clase) {
    const div = document.createElement('div');
    div.className = `message ${clase}`;
    div.innerHTML = marked.parse(texto);
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

inicializar();
