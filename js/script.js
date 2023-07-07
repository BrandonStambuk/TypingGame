const palabras = [
  "FELICIDADES",
  "CUESTIONABLE",
  "INDESTRUCTIBLE",
  "INCONSECUENTE",
  "DESESPERANTE",
  "IRREMEDIABLE",
  "IMPARCIALIDAD",
  "INCUESTIONABLE",
  "INTRANSFERIBLE",
  "IRRESPONSABLE",
  "INTERMINABLE",
  "IMPENETRABLE",
  "INEXPLICABLE",
  "INSUFRIBLE",
  "INDIFERENCIA",
  "COMPLICADO",
  "AFORTUNADO",
  "ESPECTACULAR",
  "INTEGRACIÓN",
  "EMOCIONANTE",
  "SATISFACTORIO",
  "BENEFICIOSO",
  "SIGNIFICATIVO",
  "EXTRAORDINARIO",
  "COLABORATIVO",
  "IMPORTANTE",
  "DESTACADO",
  "EXCEPCIONAL",
  "MARAVILLOSO",
  "INNOVADOR",
  "INOLVIDABLE",
  "IMPRESCINDIBLE",
  "IMPRESIONANTE",
  "PREOCUPANTE",
  "INTERESANTE",
  "ENRIQUECEDOR",
  "ATRACTIVO",
  "ALEGREMENTE",
  "ESCANDALOSO",
  "AGRESIVAMENTE",
  "ENTUSIASMADO",
  "ABUNDANTEMENTE",
  "CONMOVEDOR",
  "EXQUISITAMENTE",
  "CONFRONTACIÓN",
  "INTENSAMENTE",
  "DESLUMBRANTE",
  "AUTÉNTICAMENTE",
  "COMPRENSIBLE",
  "INEVITABLEMENTE",
  "ESPLÉNDIDAMENTE",
  "DIFICULTADES",
  "SIGNIFICATIVO",
  "IRRESISTIBLE",
  "SOBRESALIENTE",
  "INTERDEPENDENCIA",
  "SATISFACTORIAMENTE",
  "CONVENIENTE",
  "DESAGRADABLE",
  "INAPROPIADO",
  "COMPROMETIDO",
  "PARTICULARMENTE",
  "CONSCIENTEMENTE",
  "CONTRAPRODUCENTE",
  "INEXPUGNABLE",
  "RELEVANTE",
  "INTERACTIVO",
  "ACOMPAÑAMIENTO",
  "ESTRATÉGICAMENTE",
  "INCOMPARABLE",
  "IMPERTURBABLE",
  "DESTRUCTIVAMENTE",
  "ACERADAMENTE",
  "ESSENCIALMENTE",
  "INCONTESTABLE",
  "NECESARIAMENTE",
  "RAZONABLEMENTE",
  "DEFINITIVAMENTE",
  "DETERMINADAMENTE",
  "INNOVACIÓN",
  "PODEROSAMENTE",
  "ESPECTÁCULO",
  "RESPETUOSAMENTE",
  "CONTUNDENTE",
  "PERSONALMENTE",
  "ESTRATÉGICO",
  "EXTRAORDINARIAMENTE",
  "CONSECUENTEMENTE",
  "COMPROMISO",
  "INFLEXIBLE",
  "ESFUERZO",
  "DESAFIANTE",
];

function randomInRange(low, higth) {
  if (low >= higth) {
    throw "El primer argumento debe ser mayor al segundo";
  }
  return Number.parseInt(Math.random() * (higth - low) + low);
}

function salt(size) {
  let new_salt = "";
  for (let i = 1; i <= size / 2; i++) {
    let randomNumber = randomInRange(65, 90);
    new_salt += String.fromCharCode(randomNumber);
  }

  for (let i = 1; i <= size / 2; i++) {
    let randomNumber = randomInRange(97, 122);
    new_salt += String.fromCharCode(randomNumber);
  }

  return new_salt;
}

function hash(text) {
  let new_hash = "";
  for (let char of text) {
    new_hash += String.fromCharCode(char.charCodeAt() << 2);
  }
  return new_hash;
}

/////////////////////////////////////////////////////////////////////////////////////

//INDEXEDDB
var bd, tamanio, solicitud;

const CORRECT_LOGIN = 345;
const INCORRECT_PASSWORD = 346;
const USER_NOT_FOUND = 348;
const ERROR = 347;

function IniciarBaseDeDatos() {
  solicitud = indexedDB.open("TypeRacer");
  solicitud.addEventListener("error", MostrarError);
  solicitud.addEventListener("success", Comenzar);
  solicitud.addEventListener("upgradeneeded", CrearAlmacen);
}

function MostrarError(evento) {
  alert("Hay un error: " + evento.code + " / " + evento.message);
}

function Comenzar(evento) {
  bd = evento.target.result;
}

async function CrearAlmacen(evento) {
  bd = await evento.target.result;
  let metrics = await bd.createObjectStore("Metrics", { keyPath: "id" });
  metrics.createIndex("userId", "userId");
  tamanio = 0;
  let users = await bd.createObjectStore("Users", { keyPath: "id" });
  users.createIndex("username", "username");
}

function AlmacenarMetrics(
  timesBetweenLetters,
  timesReactions,
  cantWords,
  userId
) {
  var transaccion = bd.transaction(["Metrics"], "readwrite");
  var almacen = transaccion.objectStore("Metrics");
  var tamobj = almacen.count();
  tamobj.onsuccess = () => {
    tamanio = tamobj.result;
    almacen.add({
      timesBetweenLetters,
      timesReactions,
      cantWords,
      id: tamanio,
      userId,
      date: dateFormatPlotly(new Date()),
      time: timeFormatPlotly(new Date()),
    });
  };
}

function AlmacenarDatos(wpm, time, precision, userId) {
  var transaccion = bd.transaction(["Metrics"], "readwrite");
  var almacen = transaccion.objectStore("Metrics");
  var tamobj = almacen.count();
  tamobj.onsuccess = () => {
    tamanio = tamobj.result;
    almacen.add({
      palabrasPorMinuto: wpm,
      tiempo: time,
      precision,
      fecha: dateFormatPlotly(new Date()),
      hora: timeFormatPlotly(new Date()),
      id: tamanio,
      userId,
    });
  };
}

function saveUser(name, salt, hash) {
  let transaccion = bd.transaction(["Users"], "readwrite");
  let almacen = transaccion.objectStore("Users");
  let tamAlmacen = almacen.count();
  tamAlmacen.onsuccess = () => {
    let tam = tamAlmacen.result;
    almacen.add({
      id: tam,
      username: name,
      salt,
      hash,
    });
  };
}

function getUser(username) {
  return new Promise((resolve, reject) => {
    let transaccion = bd.transaction(["Users"], "readonly");
    let users = transaccion.objectStore("Users");
    let index = users.index("username");
    let request = index.get(username);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function login(username, password) {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await getUser(username);
      if (user) {
        let saltU = user.salt;
        let hashU = user.hash;
        let compare = hash(password + saltU) === hashU;
        if (compare) {
          resolve({
            status: CORRECT_LOGIN,
            user,
          });
        } else {
          resolve({
            status: INCORRECT_PASSWORD,
            user: null,
          });
        }
      } else {
        resolve({
          status: USER_NOT_FOUND,
          user: null,
        });
      }
    } catch (error) {
      reject({
        status: ERROR,
        error,
      });
    }
  });
}

function getMetricsUser(userId) {
  return new Promise((resolve, reject) => {
    let transaccion = bd.transaction(["Metrics"], "readonly");
    let users = transaccion.objectStore("Metrics");
    let index = users.index("userId");
    let request = index.getAll(IDBKeyRange.only(userId));
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function controlZero(n) {
  return `${n}` >= 10 ? n : `0${n}`;
}

function dateFormatPlotly(date) {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  month = controlZero(month);
  day = controlZero(day);
  return `${year}-${day}-${month}`;
}

function timeFormatPlotly(date) {
  const hr = controlZero(date.getHours());
  const min = controlZero(date.getMinutes());
  const seg = controlZero(date.getSeconds());

  return `${hr}:${min}:${seg}`;
}
///////////////////////////////////////////////

let $word,
  $inputPalabra,
  $countLC,
  $countLI,
  $listResults,
  $TIMETOTAL,
  $SECTIONGAME,
  $MAINHISTORIAL,
  $CANTPALABRAS;
const $root = document.getElementById("root");

let indexWord = 0,
  countAcceptLeters = 0,
  counterCorrectLetters = 0,
  counterIncorrectLetters = 0,
  cantWords = 0;
let arrayWord = [],
  wrongWords = [],
  lettersIncorrects = [];
let running = false;

let startTime, endTime, totalTime;
let timesBetweenLetters = [],
  timesReactions = [];
let timeKeyDownAct = 0,
  timeKeyDownAnt = 0,
  timeKeyUp = 0;
let letterAct = "",
  letterAnt = "";
let letterCorrectCurrent = false;
let pairs = 0;

let USER, HISTORIAL;

function Router() {
  const { hash } = location;

  if (!hash || hash === "#/") {
    $root.innerHTML = null;
    $root.appendChild(Home());
  } else if (hash === "#/typeracer") {
    $root.innerHTML = null;
    $root.appendChild(TypeRacer());
    ($word = document.getElementById("palabra")),
      ($inputPalabra = document.getElementById("input-palabra")),
      ($countLC = document.getElementById("countLC")),
      (($countLI = document.getElementById("countLI")),
      ($listResults = document.getElementById("list-results")),
      ($TIMETOTAL = document.getElementById("time-total")),
      ($CANTPALABRAS = document.getElementById("cant-palabras")),
      ($SECTIONGAME = document.getElementById("container-area-texto")));
  } else if (hash === "#/signIn") {
    $root.innerHTML = null;
    $root.appendChild(Login());
  } else if (hash === "#/signUp") {
    $root.innerHTML = null;
    $root.appendChild(Register());
  } else if (hash === "#/historial") {
    $root.innerHTML = null;
    $root.appendChild(Historial());
    $MAINHISTORIAL = document.getElementById("main-historial");
    showHistorial();
  }
}

function App() {
  IniciarBaseDeDatos();
  Router();
  let u = localStorage.getItem("user");
  let h = localStorage.getItem("historial");

  if (u && location.hash !== "#/historial") {
    USER = JSON.parse(u);
    location.hash = "#/typeracer";
  }

  if (h) {
    HISTORIAL = JSON.parse(h);
  }

  if (location.hash === "#/historial") {
    $MAINHISTORIAL = document.getElementById("main-historial");
    showHistorial();
  }
}

function Home() {
  const $divPage = document.createElement("div");
  $divPage.classList.add("page");

  const $header = document.createElement("header");
  $header.classList.add("home-page-header");
  const $h1 = document.createElement("h1");
  $h1.textContent = "TypeRacer";
  $header.appendChild($h1);

  const $nav = document.createElement("nav");
  $nav.classList.add("home-page-nav");
  const $div = document.createElement("div");
  $div.classList.add("home-page-nav-contentlinks");
  const $a1 = document.createElement("a");
  $a1.textContent = "SignIn";
  $a1.setAttribute("href", "#/signIn");
  const $a2 = document.createElement("a");
  $a2.textContent = "SignUp";
  $a2.setAttribute("href", "#/signUp");
  $div.appendChild($a1);
  $div.appendChild($a2);
  $nav.appendChild($div);

  const $main = document.createElement("main");
  $main.classList.add("home-page-main");

  $divPage.appendChild($header);
  $divPage.appendChild($nav);
  $divPage.appendChild($main);

  return $divPage;
}

function TypeRacer() {
  const $divPage = document.createElement("div");
  $divPage.classList.add("page");

  const $header = document.createElement("header");
  const $h1 = document.createElement("h1");
  $h1.textContent = "TypeRacer";
  $header.appendChild($h1);

  const $nav = document.createElement("nav");
  const $logout = document.createElement("button");
  $logout.textContent = "Logout";
  $logout.addEventListener("click", () => {
    localStorage.removeItem("user");
    localStorage.removeItem("historial");
    location.hash = "#/";
  });
  const $buttonHistorial = document.createElement("button");
  $buttonHistorial.textContent = "Historial";
  $buttonHistorial.addEventListener("click", () => {
    location.hash = "#/historial";
  });
  const $username = document.createElement("span");
  if (USER) {
    $username.textContent = USER.username;
  } else {
    let u = JSON.parse(localStorage.getItem("user"));
    $username.textContent = u.username;
  }
  $nav.appendChild($username);
  const $span = document.createElement("span");
  $span.textContent = " | ";
  $nav.appendChild($span);
  $nav.appendChild($buttonHistorial);
  const $span2 = document.createElement("span");
  $span2.textContent = " | ";
  $nav.appendChild($span2);
  $nav.appendChild($logout);

  const $main = document.createElement("main");
  $main.setAttribute("id", "main");
  const $section = document.createElement("section");
  $section.classList.add("container-area-texto");
  $section.setAttribute("id", "container-area-texto");

  const $div = document.createElement("div");
  $div.classList.add("metricas");
  const $p1 = document.createElement("p");
  $p1.classList.add("correctas");
  const $frag1 = document.createDocumentFragment();
  $frag1.textContent = "Letras Correctas: ";
  const $span1 = document.createElement("span");
  $span1.setAttribute("id", "countLC");
  $span1.textContent = "0";
  $frag1.appendChild($span1);
  $p1.appendChild($frag1);
  const $p2 = document.createElement("p");
  $p2.classList.add("correctas");
  const $frag2 = document.createDocumentFragment();
  $frag2.textContent = "Letras Incorrectas: ";
  $countLI = document.createElement("span");
  $countLI.setAttribute("id", "countLI");
  $countLI.textContent = "0";
  $frag2.appendChild($countLI);
  $p2.appendChild($frag2);
  $div.appendChild($p1);
  $div.appendChild($p2);
  const $div2 = document.createElement("div");
  $div2.classList.add("area-texto");
  $div2.setAttribute("id", "area-texto");
  const $p3 = document.createElement("p");
  $p3.classList.add("palabra");
  $p3.setAttribute("id", "palabra");
  const $p4 = document.createElement("p");
  $p4.classList.add("input-palabra");
  $p4.setAttribute("id", "input-palabra");
  const $span3 = document.createElement("span");
  $span3.classList.add("barra");
  $p4.appendChild($span3);
  $div2.appendChild($p3);
  $div2.appendChild($p4);

  const $div3 = document.createElement("div");
  $div3.classList.add("container-buttons");
  const $btn1 = document.createElement("button");
  $btn1.setAttribute("id", "btn-start");
  $btn1.textContent = "Empezar";
  const $btn2 = document.createElement("button");
  $btn2.setAttribute("id", "btn-end");
  $btn2.textContent = "Terminar";
  $div3.appendChild($btn1);
  $div3.appendChild($btn2);

  const $div4 = document.createElement("div");
  $div4.classList.add("container-results");
  const $h2 = document.createElement("h2");
  $h2.textContent = "Resultados";
  const $h33 = document.createElement("h3");
  $h33.textContent = "";
  $h33.setAttribute("id", "cant-palabras");
  const $h3 = document.createElement("h3");
  $h3.textContent = "";
  $h3.setAttribute("id", "time-total");
  $listResults = document.createElement("ul");
  $listResults.classList.add("list-results");
  $listResults.setAttribute("id", "list-results");

  const $div5 = document.createElement("div");
  $div5.setAttribute("id", "chart1");
  $div5.classList.add("chart");
  const $canvas = document.createElement("canvas");
  $canvas.setAttribute("id", "myChart00");
  $div5.appendChild($canvas);

  const $div6 = document.createElement("div");
  $div6.setAttribute("id", "chart2");
  $div6.classList.add("chart");
  const $canvas2 = document.createElement("canvas");
  $canvas2.setAttribute("id", "myChart001");
  $div6.appendChild($canvas2);

  $section.appendChild($div);
  $section.appendChild($div2);
  $section.appendChild($div3);
  $section.appendChild($div4);
  $section.appendChild($div5);
  $section.appendChild($div6);

  $div4.appendChild($h2);
  $div4.appendChild($h33);
  $div4.appendChild($h3);
  $div4.appendChild($listResults);

  $main.appendChild($section);

  $divPage.appendChild($header);
  $divPage.appendChild($nav);
  $divPage.appendChild($main);

  document.body.addEventListener("keydown", eventKeyDown);
  document.body.addEventListener("keyup", eventKeyUp);

  $btn1.addEventListener("click", init);

  $btn2.addEventListener("click", end);

  return $divPage;
}

function Login() {
  const $div = document.createElement("div");
  $div.classList.add("page-auth");
  const $header = document.createElement("header");
  $header.classList.add("header-auth");
  const $h1 = document.createElement("h1");
  $h1.textContent = "Login";
  const $a = document.createElement("a");
  $a.setAttribute("href", "#/");
  $a.textContent = "Back";
  $header.appendChild($h1);
  $header.appendChild($a);
  $div.appendChild($header);
  $div.appendChild(LoginForm());

  return $div;
}

async function handleLogin(e) {
  e.preventDefault();
  const $form = e.target;
  const $username = $form.username;
  const $password = $form.password;
  const username = $username.value;
  const password = $password.value;
  const $error = document.querySelector(".error");

  if (username === "" || password === "") {
    $error.textContent = "Todos los campos son obligatorios";
    $error.classList.add("active");
    return;
  }
  $error.classList.remove("active");
  try {
    let request = await login(username, password);
    if (request.status === CORRECT_LOGIN) {
      let user = await getUser(username);
      localStorage.setItem("user", JSON.stringify(user));
      USER = user;
      location.hash = "#/typeracer";
    } else if (request.status === INCORRECT_PASSWORD) {
      $error.textContent = "Contraseña incorrecta";
      $error.classList.add("active");
    } else {
      $error.textContent = "Usuario no registrado";
      $error.classList.add("active");
    }
  } catch (error) {
    console.log(error);
  }
}

function LoginForm() {
  const $section = document.createElement("section");
  $section.classList.add("section-form");
  const $div = document.createElement("div");
  $div.classList.add("container-form");
  const $form = document.createElement("form");
  $form.addEventListener("submit", handleLogin);
  const $div1 = document.createElement("div");
  $div1.classList.add("container-inputs");
  const $label1 = document.createElement("label");
  $label1.setAttribute("for", "username");
  $label1.textContent = "UserName";
  const $input1 = document.createElement("input");
  $input1.setAttribute("type", "text");
  $input1.setAttribute("id", "username");
  $input1.addEventListener("input", () => {
    const value = $input1.value;
    const newValue = value.replace(/\s+/g, "");
    if (newValue !== value) {
      $input1.value = newValue;
    }
  });
  $input1.setAttribute("required", true);
  $input1.setAttribute("autoFocus", true);
  $div1.appendChild($label1);
  $div1.appendChild($input1);

  const $div2 = document.createElement("div");
  $div2.classList.add("container-inputs");
  const $label2 = document.createElement("label");
  $label2.setAttribute("for", "password");
  $label2.textContent = "Password";
  const $input2 = document.createElement("input");
  $input2.setAttribute("type", "password");
  $input2.setAttribute("id", "password");
  $input2.addEventListener("input", () => {
    const value = $input2.value;
    const newValue = value.replace(/\s+/g, "");
    if (newValue !== value) {
      $input2.value = newValue;
    }
  });
  $input2.setAttribute("required", true);
  $div2.appendChild($label2);
  $div2.appendChild($input2);

  const $button = document.createElement("button");
  $button.textContent = "Login";
  $form.appendChild($div1);
  $form.appendChild($div2);
  $form.appendChild($button);
  const $error = document.createElement("p");
  $error.classList.add("error");
  $error.classList.add("hidden");
  $error.setAttribute("id", "error");
  $error.setAttribute("name", "error");
  $form.appendChild($error);
  $div.appendChild($form);
  $section.appendChild($div);
  return $section;
}

function Register() {
  const $div = document.createElement("div");
  $div.classList.add("page-auth");
  const $header = document.createElement("header");
  $header.classList.add("header-auth");
  const $h1 = document.createElement("h1");
  $h1.textContent = "Register";
  const $a = document.createElement("a");
  $a.setAttribute("href", "#/");
  $a.textContent = "Back";
  $header.appendChild($h1);
  $header.appendChild($a);
  $div.appendChild($header);
  $div.appendChild(RegisterForm());

  return $div;
}

async function handleRegister(e) {
  e.preventDefault();
  const $form = e.target;
  const $username = $form.username;
  const $password = $form.password;
  const $confirmPassword = $form.confirmPassword;
  const $error = document.querySelector(".error");

  try {
    let user = await getUser($username.value);
    if (user) {
      $error.textContent = "El usuario ya existe";
      $error.classList.add("active");
      $username.focus();
      return;
    } else {
      if ($password.value !== $confirmPassword.value) {
        $error.textContent = "Las contraseñas no coinciden";
        $error.classList.add("active");
        $password.focus();
        return;
      }
      const saltU = salt(5);
      const hashU = hash($form.password.value + saltU);
      saveUser($username.value, saltU, hashU);
      /*
				clear inputs
			*/
      $username.value = "";
      $password.value = "";
      $confirmPassword.value = "";
      alert("Usuario registrado correctamente :)");
      location.hash = "#/";
    }
  } catch (error) {
    console.log(error);
  }
}

function RegisterForm() {
  const $section = document.createElement("section");
  $section.classList.add("section-form");
  const $div = document.createElement("div");
  $div.classList.add("container-form");
  const $form = document.createElement("form");
  $form.addEventListener("submit", handleRegister);
  const $div1 = document.createElement("div");
  $div1.classList.add("container-inputs");
  const $label1 = document.createElement("label");
  $label1.setAttribute("for", "username");
  $label1.textContent = "UserName";
  const $input1 = document.createElement("input");
  $input1.setAttribute("type", "text");
  $input1.setAttribute("id", "username");
  $input1.setAttribute("name", "username");
  $input1.addEventListener("input", () => {
    const value = $input1.value;
    const newValue = value.replace(/\s+/g, "");
    if (newValue !== value) {
      $input1.value = newValue;
    }
  });
  $input1.setAttribute("required", true);
  $input1.setAttribute("autoFocus", true);
  $div1.appendChild($label1);
  $div1.appendChild($input1);

  const $div2 = document.createElement("div");
  $div2.classList.add("container-inputs");
  const $label2 = document.createElement("label");
  $label2.setAttribute("for", "password");
  $label2.textContent = "Password";
  const $input2 = document.createElement("input");
  $input2.setAttribute("type", "password");
  $input2.setAttribute("id", "password");
  $input2.setAttribute("name", "password");
  $input2.addEventListener("input", () => {
    const value = $input2.value;
    const newValue = value.replace(/\s+/g, "");
    if (newValue !== value) {
      $input2.value = newValue;
    }
  });
  $input2.setAttribute("required", true);
  $div2.appendChild($label2);
  $div2.appendChild($input2);

  const $div3 = document.createElement("div");
  $div3.classList.add("container-inputs");
  const $label3 = document.createElement("label");
  $label3.setAttribute("for", "confirm-password");
  $label3.textContent = "Confirm Password";
  const $input3 = document.createElement("input");
  $input3.setAttribute("type", "password");
  $input3.setAttribute("id", "confirm-password");
  $input3.setAttribute("name", "confirmPassword");
  $input3.addEventListener("input", () => {
    const value = $input3.value;
    const newValue = value.replace(/\s+/g, "");
    if (newValue !== value) {
      $input3.value = newValue;
    }
  });
  $input3.setAttribute("required", true);
  $div3.appendChild($label3);
  $div3.appendChild($input3);

  const $button = document.createElement("button");
  $button.textContent = "Register Account";
  $form.appendChild($div1);
  $form.appendChild($div2);
  $form.appendChild($div3);
  $form.appendChild($button);
  const $error = document.createElement("p");
  $error.classList.add("error");
  $error.classList.add("hidden");
  $error.setAttribute("id", "error");
  $error.setAttribute("name", "error");
  $form.appendChild($error);
  $div.appendChild($form);
  $section.appendChild($div);
  return $section;
}

/*
  Funciones para el juego
*/

function getRandomWord() {
  let index = parseInt(Math.random() * palabras.length);
  return palabras[index];
}

function pushWord() {
  const newWord = getRandomWord();
  const $temp = document.createDocumentFragment();
  for (let i = 0; i < newWord.length; i++) {
    const $span = document.createElement("span");
    $span.textContent = newWord[i];
    $temp.appendChild($span);
    arrayWord.push(newWord[i]);
  }
  while ($word.firstChild) {
    $word.removeChild($word.firstChild);
  }
  $word.appendChild($temp);
}

function resetMetrics() {
  counterCorrectLetters = 0;
  counterIncorrectLetters = 0;
  wrongWords = [];
  $countLC.innerHTML = counterCorrectLetters;
  $countLI.innerHTML = counterIncorrectLetters;
}

function reset() {
  $listResults.innerHTML = "";
  arrayWord = [];
  lettersIncorrects = [];
  indexWord = 0;
  countAcceptLeters = 0;

  const $last = $inputPalabra.lastElementChild;
  $inputPalabra.textContent = "";
  $inputPalabra.appendChild($last);
}

function updateStateCharacterWord(actE, newE) {
  $word.childNodes[indexWord].classList.remove(actE);
  $word.childNodes[indexWord].classList.add(newE);
}

function insertCharacterInput(c) {
  let $span = document.createElement("span");
  $span.textContent = c.toUpperCase();
  let last = $inputPalabra.lastElementChild;
  $inputPalabra.insertBefore($span, last);
}

function eventKeyDown(event) {
  let c = event.key;
  if (
    running &&
    ((event.keyCode >= 65 && event.keyCode <= 122) ||
      c === "," ||
      c === "." ||
      c === "ñ")
  ) {
    if (c.toUpperCase() === arrayWord[indexWord]) {
      timeKeyDownAct = new Date().getTime();
      letterAct = c.toUpperCase();
      letterCorrectCurrent = true;
      pairs++;
      if (pairs === 2) {
        timesBetweenLetters.push({
          tag: letterAnt + letterAct,
          time: timeKeyDownAct - timeKeyDownAnt,
        });
        pairs = 1;
      }
      timeKeyDownAnt = timeKeyDownAct;
      letterAnt = letterAct;
      updateStateCharacterWord("wrong-fall", "accept");
      insertCharacterInput(c);
      indexWord++;
      countAcceptLeters++;
      counterCorrectLetters++;
      $countLC.innerHTML = counterCorrectLetters;
      if (countAcceptLeters === arrayWord.length) {
        let word = arrayWord.join("");
        if (lettersIncorrects.length > 0) {
          wrongWords.push({
            word,
            lettersIncorrects,
          });
        }
        reset();
        cantWords++;
        pushWord();
      }
    } else {
      letterCorrectCurrent = false;
      if (
        lettersIncorrects.length == 0 ||
        lettersIncorrects[lettersIncorrects.length - 1].index !== indexWord
      ) {
        lettersIncorrects.push({
          index: indexWord,
          letter: c,
        });
        counterIncorrectLetters++;
      }
      $countLI.innerHTML = counterIncorrectLetters;
      updateStateCharacterWord("accept", "wrong-fall");
    }
  }
}

function eventKeyUp(event) {
  let c = event.key;
  if (
    running &&
    ((event.keyCode >= 65 && event.keyCode <= 122) ||
      c === "," ||
      c === "." ||
      c === "ñ")
  ) {
    if (letterCorrectCurrent) {
      timeKeyUp = new Date().getTime();
      timesReactions.push({
        tag: c.toUpperCase(),
        time: timeKeyUp - timeKeyDownAct,
      });
    }
  }
}

function showResults() {
  const $temp = document.createDocumentFragment();
  wrongWords.forEach((e) => {
    const $p = document.createElement("p");
    const $p2 = document.createElement("p");
    const $li = document.createElement("li");
    let word = e.word.split("");
    let letters = e.lettersIncorrects;

    letters.forEach((letra) => {
      let index = letra.index,
        letter = letra.letter;
      word[index] = {
        letterCorrect: word[index],
        letterIncorrect: letter,
      };
    });

    word.forEach((l) => {
      const $span = document.createElement("span");
      const $spanI = document.createElement("span");
      if (l.letterCorrect) {
        $span.textContent = l.letterCorrect.toUpperCase();
        $span.classList.add("wrong");
        $p.appendChild($span);

        $spanI.textContent = l.letterIncorrect.toUpperCase();
        $spanI.classList.add("wrong");
        $p2.appendChild($spanI);
      } else {
        $span.textContent = l.toUpperCase();
        $span.classList.add("accept");
        $p.appendChild($span);

        $spanI.textContent = l.toUpperCase().toUpperCase();
        $spanI.style.fontSize = "1.5rem";
        $p2.appendChild($spanI);
      }
    });
    $li.appendChild($p);
    $li.appendChild($p2);
    $temp.appendChild($li);
  });
  if (wrongWords.length === 0) {
    const $li = document.createElement("li");
    const $p = document.createElement("p");
    $p.textContent = "No hubo errores";
    $li.appendChild($p);
    $temp.appendChild($li);
  }

  $TIMETOTAL.innerHTML = "Tiempo total: " + totalTime + " ms";

  $listResults.appendChild($temp);
}

function init() {
  pairs = 0;
  timesReactions = [];
  timesBetweenLetters = [];
  $TIMETOTAL.innerHTML = "";
  $CANTPALABRAS.innerHTML = "";

  document.getElementById("chart1").innerHTML = "";
  document.getElementById("chart2").innerHTML = "";

  const $canvas2 = document.createElement("canvas");
  $canvas2.setAttribute("id", "myChart001");
  document.getElementById("chart2").appendChild($canvas2);

  const $canvas = document.createElement("canvas");
  $canvas.setAttribute("id", "myChart00");
  document.getElementById("chart1").appendChild($canvas);

  running = true;
  reset();
  resetMetrics();
  pushWord();
  startTime = new Date().getTime();
}

function end() {
  if (running) {
    $word.innerHTML = "";
    running = false;
    endTime = new Date().getTime();
    totalTime = endTime - startTime;
    showResults();
    $CANTPALABRAS.innerHTML = "Cantidad de palabras: " + cantWords;
    AlmacenarMetrics(timesBetweenLetters, timesReactions, cantWords, USER.id);
    cantWords = 0;
    showGraphs(timesBetweenLetters, timesReactions, "myChart00", "myChart001");
  }
}

function Historial() {
  const $divPage = document.createElement("div");
  $divPage.classList.add("page");

  const $header = document.createElement("header");
  const $h1 = document.createElement("h1");
  $h1.textContent = "Hitorial";
  $header.appendChild($h1);

  const $nav = document.createElement("nav");
  const $logout = document.createElement("button");
  $logout.textContent = "Back";
  $logout.addEventListener("click", () => {
    location.hash = "#/typeracer";
  });

  const $username = document.createElement("span");
  if (USER) {
    $username.textContent = USER.username;
  } else {
    let u = JSON.parse(localStorage.getItem("user"));
    $username.textContent = u.username;
  }

  $nav.appendChild($username);
  const $span = document.createElement("span");
  $span.textContent = " | ";
  $nav.appendChild($span);
  $nav.appendChild($logout);

  const $main = document.createElement("main");
  $main.setAttribute("id", "main-historial");

  $divPage.appendChild($header);
  $divPage.appendChild($nav);
  $divPage.appendChild($main);

  return $divPage;
}

const showHistorial = async () => {
  try {
    if (!USER) USER = JSON.parse(localStorage.getItem("user"));
    HISTORIAL = await getMetricsUser(USER.id);
    localStorage.setItem("historial", JSON.stringify(HISTORIAL));
    HISTORIAL.forEach((h, index) => {
      const { timesBetweenLetters, timesReactions, date, time, cantWords } = h;
      const $containerHistorial = document.createElement("div");
      $containerHistorial.classList.add("container-historial");
      const $div = document.createElement("div");
      $div.classList.add("chart");
      const $canvas = document.createElement("canvas");
      $canvas.id = "myChart" + index;
      $div.appendChild($canvas);

      const $div2 = document.createElement("div");
      $div2.classList.add("chart");
      const $canvas2 = document.createElement("canvas");
      $canvas2.id = "myChart" + index + "#";
      $div2.appendChild($canvas2);

      const $p = document.createElement("p");
      $p.textContent = "Fecha: " + date;
      const $p2 = document.createElement("p");
      $p2.textContent = "Hora: " + time;
      const $p3 = document.createElement("p");
      $p3.textContent = "Cantidad de palabras: " + cantWords;

      $containerHistorial.appendChild($p);
      $containerHistorial.appendChild($p2);
      $containerHistorial.appendChild($p3);

      $containerHistorial.appendChild($div);
      $containerHistorial.appendChild($div2);

      $MAINHISTORIAL.appendChild($containerHistorial);

      showGraphs(timesBetweenLetters, timesReactions, $canvas.id, $canvas2.id);
    });
  } catch (error) {
    console.log(error);
  }
};

function showGraphs(timesBL, timesR, idCanvas1, idCanvas2) {
  let barColors = [];
  let xtimesBetweenLetters = [];
  let ytimesBetweenLetters = [];
  let xtimesReactions = [];
  let ytimesReactions = [];
  for (let j = 0; j < timesBL.length; j++) {
    barColors.push("blue");
    xtimesBetweenLetters.push(timesBL[j].tag);
    ytimesBetweenLetters.push(timesBL[j].time);
  }
  new Chart(idCanvas1, {
    type: "bar",
    data: {
      labels: xtimesBetweenLetters,
      datasets: [
        {
          backgroundColor: barColors,
          data: ytimesBetweenLetters,
        },
      ],
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: "velocidad cambio de letra",
      },
    },
  });

  for (let j = 0; j < timesR.length; j++) {
    barColors.push("blue");
    xtimesReactions.push(timesR[j].tag);
    ytimesReactions.push(timesR[j].time);
  }
  new Chart(idCanvas2, {
    type: "bar",
    data: {
      labels: xtimesReactions,
      datasets: [
        {
          backgroundColor: barColors,
          data: ytimesReactions,
        },
      ],
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: "tiempo de reaccion",
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", App);

window.addEventListener("hashchange", App, false);
