const menu = document.getElementById("menu");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cartCounter = document.getElementById("cart-count");
const addressInput = document.getElementById("address");
const addressWarn = document.getElementById("address-warn");
const addressNumberInput = document.getElementById("address-number");
const addressNumberWarn = document.getElementById("address-number-warn");
const nomeInput = document.getElementById("inputName");
const phoneInput = document.getElementById("phone");
const phoneWarn = document.getElementById("phone-warn");
const cepInput = document.getElementById("cep");
const cepBtn = document.getElementById("cep-btn");
const cepWarn = document.getElementById("cep-warn");
const paymentWarn = document.getElementById("payment-warn");
const detailsInput = document.getElementById("more-details");
const detailsWarn = document.getElementById("details-warn");
const detailsCount = document.getElementById('details-count');
const DETAILS_MAX = 400;
const changeField = document.getElementById("change-field");
const changeAmountInput = document.getElementById("change-amount");
const changeWarn = document.getElementById("change-warn");

// guardar texto original do botão de checkout para restaurar depois
const checkoutBtnDefaultText = checkoutBtn ? checkoutBtn.textContent.trim() : 'Finalizar pedido';


let cart = [];

// Navegação - filtragem por categoria + animação fade
const navLinks = document.querySelectorAll('.nav-link');
const filterItems = document.querySelectorAll('#menu [data-category]');

function setActiveNav(link){
  navLinks.forEach(l=>{
    l.classList.remove('bg-red-50','text-red-600','font-bold');
  })
  if(link) link.classList.add('bg-red-50','text-red-600','font-bold');
}

function updateSectionVisibility(){
  // Promoções
  const promotions = document.querySelectorAll('#promotions [data-category]');
  const promotionsHeading = document.querySelector('#promotions h3');
  if(promotionsHeading){
    const anyVisible = Array.from(promotions).some(p => !p.classList.contains('hidden'));
    promotionsHeading.style.display = anyVisible ? 'block' : 'none';
  }

  // Bebidas heading
  const bebidasHeading = document.getElementById('beverages-heading');
  if(bebidasHeading){
    const bebidaItems = document.querySelectorAll('[data-category="bebidas"]');
    const anyVisible = Array.from(bebidaItems).some(i => !i.classList.contains('hidden'));
    bebidasHeading.style.display = anyVisible ? 'block' : 'none';
  }
}

function showItem(item){
  item.classList.remove('hidden');
  item.classList.add('opacity-0','translate-y-2','transition-all','duration-200');
  // force reflow
  void item.offsetWidth;
  item.classList.remove('opacity-0','translate-y-2');
}

function hideItem(item){
  item.classList.add('opacity-0','translate-y-2','transition-all','duration-200');
  setTimeout(()=>{
    item.classList.add('hidden');
    item.classList.remove('opacity-0','translate-y-2','transition-all','duration-200');
  }, 200);
}

function filterByCategory(category){
  filterItems.forEach(item=>{
    if(category === 'all' || item.dataset.category === category){
      // show with animation
      if(item.classList.contains('hidden')) showItem(item);
    } else {
      // hide with animation
      if(!item.classList.contains('hidden')) hideItem(item);
    }
  });

  // atualizar os headings visíveis
  setTimeout(updateSectionVisibility, 220);
}

navLinks.forEach(link=>{
  link.addEventListener('click', function(){
    const cat = this.dataset.category;
    setActiveNav(this);
    filterByCategory(cat);
  })
});

// marcar 'Todos' ativo por padrão
if(navLinks && navLinks.length) setActiveNav(navLinks[0]);

// Mostrar / esconder modal com animação
function showCartModal(){
  updateCartModal();
  // mostrar overlay e ativar animação via classe
  cartModal.classList.remove('hidden');
  // small timeout to allow browser to register the removal before adding visible class
  setTimeout(() => cartModal.classList.add('modal-visible'), 10);
  // Esconder campo de troco ao abrir o modal
  if(changeField) changeField.classList.add('hidden');
  if(changeAmountInput) {
    changeAmountInput.value = '';
    changeAmountInput.classList.remove('border-red-500');
  }
  if(changeWarn) changeWarn.classList.add('hidden');
}

function hideCartModal(){
  // remover classe visível e esconder após transição
  cartModal.classList.remove('modal-visible');
  setTimeout(() => cartModal.classList.add('hidden'), 300);
  // Limpar campo de troco ao fechar
  if(changeField) changeField.classList.add('hidden');
  if(changeAmountInput) {
    changeAmountInput.value = '';
    changeAmountInput.classList.remove('border-red-500');
  }
  if(changeWarn) changeWarn.classList.add('hidden');
}

//Abrir o modal do carrinho
if(cartBtn) cartBtn.addEventListener('click', showCartModal);

//Fechar o modal quando clicar fora
cartModal.addEventListener('click', function(event){
  if(event.target === cartModal) hideCartModal();
});

if(closeModalBtn) closeModalBtn.addEventListener('click', hideCartModal);
// botão de fechar no topo do modal (criado no markup)
const closeTopBtn = document.getElementById('close-top-btn');
if(closeTopBtn) closeTopBtn.addEventListener('click', hideCartModal);

menu.addEventListener("click", function (event) {
  //console.log(event.target)
  let parentButton = event.target.closest(".add-to-card-btn");

  if (parentButton) {

    const name = parentButton.getAttribute("data-name");
    const price = parseFloat(parentButton.getAttribute("data-price"));
    //Adicionar no carrinho
    addToCart(name, price);
  }
});

//Função para adicionar no carrinho
function addToCart(name, price,contato) {
  const existingItem = cart.find((item) => item.name === name);

  if (existingItem) {
    //Se o item ja existe, aumenta apenas a quantidade +1
    existingItem.quantity += 1;
  } else {
    cart.push({

      name,
      price,
      quantity: 1,
    });
  }
  updateCartModal();
}

//Atualiza o carrinho

function updateCartModal() {
  cartItemsContainer.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'text-center text-gray-600 py-6';
    emptyEl.textContent = 'Seu carrinho está vazio.';
    cartItemsContainer.appendChild(emptyEl);
  } else {
    cart.forEach((item) => {
      // tentar localizar uma imagem existente para o produto
      let imgSrc = './assets/hamb-1.png';
      const candidates = document.querySelectorAll('[data-name]');
      for (const cand of candidates) {
        if (cand.dataset && cand.dataset.name === item.name) {
          const card = cand.closest('[data-category]') || cand.parentElement;
          if (card) {
            const img = card.querySelector('img');
            if (img && img.getAttribute('src')) {
              imgSrc = img.getAttribute('src');
            }
          }
          break;
        }
      }

      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'flex items-center gap-3 bg-gray-50 p-2 rounded';

      cartItemElement.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}" class="w-14 h-14 object-cover rounded" />
        <div class="flex-1">
          <p class="font-medium">${item.name}</p>
          <p class="text-sm text-gray-600">R$ ${item.price.toFixed(2)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="decrease-btn bg-gray-200 px-2 py-1 rounded" data-name="${item.name}" title="Diminuir quantidade" aria-label="Diminuir ${item.name}">−</button>
          <span class="font-medium">${item.quantity}</span>
          <button class="increase-btn bg-gray-200 px-2 py-1 rounded" data-name="${item.name}" data-price="${item.price}" title="Aumentar quantidade" aria-label="Aumentar ${item.name}">+</button>
        </div>
        <button class="remove-from-card-btn bg-red-500 text-white px-2 py-1 rounded" data-name="${item.name}" title="Remover ${item.name}" aria-label="Remover ${item.name}">Remover</button>
      `;

      total += item.price * item.quantity;
      cartItemsContainer.appendChild(cartItemElement);
    });
  }

  // ocultar/exibir campos do modal quando o carrinho estiver vazio
  const cartFormEl = document.getElementById('cart-form');
  const cartFooterEl = document.getElementById('cart-footer');
  if (cartFormEl) {
    cartFormEl.style.display = cart.length === 0 ? 'none' : '';
  }
  if (cartFooterEl) {
    cartFooterEl.style.display = cart.length === 0 ? 'none' : 'flex';
  }

  cartTotal.textContent = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Calcular e mostrar total final (subtotal + taxa de entrega)
  const deliveryFee = 5.00;
  const totalFinal = cart.length > 0 ? total + deliveryFee : deliveryFee;
  const cartTotalFinal = document.getElementById('cart-total-final');
  if (cartTotalFinal) {
    cartTotalFinal.textContent = totalFinal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // Mostrar número de itens distintos no carrinho
  const distinctCount = cart.length;
  cartCounter.innerHTML = distinctCount;

  // Atualizar região aria-live para contagem (leitores de tela)
  const cartLiveEl = document.getElementById('cart-live');
  if (cartLiveEl) {
    if (distinctCount === 0) {
      cartLiveEl.textContent = 'Seu carrinho está vazio.';
    } else {
      cartLiveEl.textContent = `${distinctCount} ${distinctCount === 1 ? 'item' : 'itens'} no carrinho.`;
    }
  }

  // Habilitar / desabilitar botão de checkout conforme o carrinho
  if (checkoutBtn) {
    if (cart.length === 0) {
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
      checkoutBtn.classList.remove('bg-green-500','checkout-btn');
      // alterar texto quando desabilitado
      checkoutBtn.textContent = 'Carrinho vazio';
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      checkoutBtn.classList.add('checkout-btn');
      // restaurar texto original
      checkoutBtn.textContent = checkoutBtnDefaultText;
    }
  }
}
//Função para remover o item no carrinho
cartItemsContainer.addEventListener("click", function (event) {
  const target = event.target;
  if (target.classList.contains("remove-from-card-btn")) {
    const name = target.getAttribute("data-name");
    removeItemCard(name);
    return;
  }

  if (target.classList.contains('increase-btn')){
    const name = target.getAttribute('data-name');
    const price = parseFloat(target.getAttribute('data-price')) || 0;
    addToCart(name, price);
    return;
  }

  if (target.classList.contains('decrease-btn')){
    const name = target.getAttribute('data-name');
    removeItemCard(name);
    return;
  }
});

function removeItemCard(name) {
  const index = cart.findIndex((item) => item.name === name);

  if (index !== -1) {
    const item = cart[index];

    if (item.quantity > 1) {
      item.quantity -= 1;
      updateCartModal();
      return;
    }

    cart.splice(index, 1);
    updateCartModal();
  }
}
addressInput.addEventListener("input", function(event){
  let inputValue = event.target.value;

  if(inputValue !== ""){
    addressInput.classList.remove("border-red-500")
    addressWarn.classList.add("hidden")
  }
})

// limpar aviso quando digitar número
if(addressNumberInput){
  addressNumberInput.addEventListener('input', function(e){
    if(e.target.value.trim() !== ''){
      addressNumberInput.classList.remove('border-red-500');
      if(addressNumberWarn) addressNumberWarn.classList.add('hidden');
    }
  });
}

// remover aviso quando digitar telefone
if(phoneInput){
  phoneInput.addEventListener("input", function(e){
    if(e.target.value.trim() !== ""){
      phoneInput.classList.remove("border-red-500");
      phoneWarn.classList.add("hidden");
    }
  })
}

// remover aviso quando digitar nos detalhes e atualizar contador, limitar tamanho
if(detailsInput){
  const updateDetailsCount = (v) => {
    if(detailsCount) detailsCount.textContent = `${v.length}/${DETAILS_MAX}`;
  }

  detailsInput.addEventListener('input', function(e){
    let v = e.target.value;
    if(v.length > DETAILS_MAX) {
      v = v.slice(0, DETAILS_MAX);
      e.target.value = v;
    }
    if(v.trim().length > 0){
      detailsInput.classList.remove('border-red-500');
      if(detailsWarn) detailsWarn.classList.add('hidden');
    }
    updateDetailsCount(v);
  });

  // inicializar contador
  updateDetailsCount(detailsInput.value || '');
}

// Buscar CEP via ViaCEP
if(cepBtn){
  cepBtn.addEventListener("click", function(){
    const raw = (cepInput && cepInput.value) ? cepInput.value.replace(/\D/g,"") : "";
    if(!raw || raw.length !== 8){
      if(cepWarn) cepWarn.classList.remove("hidden");
      return;
    }

    fetch(`https://viacep.com.br/ws/${raw}/json/`)
      .then(res => res.json())
      .then(data => {
        if(data.erro){
          if(cepWarn) cepWarn.classList.remove("hidden");
          return;
        }

        const formatted = `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ' - ' : ''}${data.localidade} - ${data.uf}`;
        addressInput.value = formatted;
        addressInput.classList.remove("border-red-500");
        addressWarn.classList.add("hidden");
        if(cepWarn) cepWarn.classList.add("hidden");
      })
      .catch(() => { if(cepWarn) cepWarn.classList.remove("hidden"); })
  })
}

// Remover aviso de erro no nome quando o usuário digitar
if(nomeInput){
  nomeInput.addEventListener("input", function(event){
    if(event.target.value.trim() !== ""){
      nomeInput.classList.remove("border-red-500");
    }
  })
}

//Finalizar Pedido
checkoutBtn.addEventListener("click", function(){

  const isOpen = checkRestaurantOpen();
  if(!isOpen){

    Toastify({
      text: "Ops o restaurante está fechado",
      duration: 6000,
      //destination: "https://github.com/apvarun/toastify-js",
      close: true,
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#ef4444",
      },
  }).showToast();
  return;
}

  if(cart.length === 0) return;

  // Validação do nome para contato
  if(!nomeInput || nomeInput.value.trim() === ""){
    Toastify({
      text: "Digite um nome para contato",
      duration: 4000,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: "#ef4444",
      },
    }).showToast();

    if(nomeInput) nomeInput.classList.add("border-red-500");
    return;
  }

  // Validação do telefone
  if(!phoneInput || !/^\d{10,11}$/.test(phoneInput.value.replace(/\D/g,""))){
    Toastify({
      text: "Digite um telefone válido (10-11 dígitos)",
      duration: 4000,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: { background: "#ef4444" }
    }).showToast();
    if(phoneInput) phoneInput.classList.add("border-red-500");
    if(phoneWarn) phoneWarn.classList.remove("hidden");
    return;
  }

  // Validação do método de pagamento
  const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
  if(!selectedPayment){
    Toastify({
      text: "Selecione um método de pagamento",
      duration: 4000,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: { background: "#ef4444" }
    }).showToast();
    if(paymentWarn) paymentWarn.classList.remove("hidden");
    return;
  } else {
    if(paymentWarn) paymentWarn.classList.add("hidden");
  }

  // Validação do campo de troco quando dinheiro é selecionado
  if(selectedPayment.value === 'Dinheiro') {
    if(!changeAmountInput || !changeAmountInput.value.trim()) {
      Toastify({
        text: "Digite o valor para o troco",
        duration: 4000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: { background: "#ef4444" }
      }).showToast();
      if(changeAmountInput) changeAmountInput.classList.add('border-red-500');
      if(changeWarn) changeWarn.classList.remove('hidden');
      return;
    }
    // Validar se o valor do troco é um número válido
    const changeValue = parseFloat(changeAmountInput.value.replace(',', '.'));
    if(isNaN(changeValue) || changeValue <= 0) {
      Toastify({
        text: "Digite um valor válido para o troco",
        duration: 4000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: { background: "#ef4444" }
      }).showToast();
      if(changeAmountInput) changeAmountInput.classList.add('border-red-500');
      if(changeWarn) changeWarn.classList.remove('hidden');
      return;
    }
  }

  if(addressInput.value === ""){
    addressWarn.classList.remove("hidden")
    addressInput.classList.add("border-red-500")
    return;
  }

  // validar número do endereço
  if(addressNumberInput && addressNumberInput.value.trim() === ""){
    if(addressNumberWarn) addressNumberWarn.classList.remove('hidden');
    addressNumberInput.classList.add('border-red-500');
    return;
  }

  // Validação do campo 'Mais detalhes' (opcional)
  if(detailsInput){
    const val = detailsInput.value.trim();
    if(val.length > 0 && val.length < 5){
      Toastify({ text: "Campo 'Mais detalhes' muito curto (mínimo 5 caracteres)", duration: 4000, close: true, gravity: "top", position: "right", style: { background: "#ef4444" } }).showToast();
      detailsInput.classList.add('border-red-500');
      if(detailsWarn) detailsWarn.classList.remove('hidden');
      return;
    }
    if(val.length > DETAILS_MAX){
      Toastify({ text: `Campo 'Mais detalhes' excede ${DETAILS_MAX} caracteres`, duration: 4000, close: true, gravity: "top", position: "right", style: { background: "#ef4444" } }).showToast();
      detailsInput.classList.add('border-red-500');
      if(detailsWarn) detailsWarn.classList.remove('hidden');
      return;
    }
  }

    // Enviar o pedido para API do whatsapp
    const cartItems = cart.map((item) => {
      const subtotal = (item.price * item.quantity).toFixed(2);
      return `${item.name} - Qtd: ${item.quantity} - R$ ${item.price.toFixed(2)} - Subtotal: R$ ${subtotal}`;
    }).join("\n");

    // Calcular total do pedido
    let subtotalValue = 0;
    cart.forEach((item) => {
      subtotalValue += item.price * item.quantity;
    });
    const deliveryFee = 5.00;
    const totalFinal = subtotalValue + deliveryFee;

    const moreDetailsText = (detailsInput && detailsInput.value.trim()) ? `Mais detalhes: ${detailsInput.value.trim()}\n` : '';
    const enderecoFull = `${addressInput.value}${addressNumberInput && addressNumberInput.value.trim() ? ', Nº ' + addressNumberInput.value.trim() : ''}`;
    const subtotalFormatted = subtotalValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const totalFinalFormatted = totalFinal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    
    // Adicionar informação de troco se pagamento for em dinheiro
    const changeText = (selectedPayment.value === 'Dinheiro' && changeAmountInput && changeAmountInput.value.trim()) 
      ? `Troco para: R$ ${parseFloat(changeAmountInput.value.replace(',', '.')).toFixed(2).replace('.', ',')}\n` 
      : '';
    
    const messageText = `Pedido de: ${nomeInput.value}\nTelefone: ${phoneInput.value}\nPagamento: ${selectedPayment.value}\n${changeText}Endereço: ${enderecoFull}\n${moreDetailsText}\nItens:\n${cartItems}\n\nSubtotal: ${subtotalFormatted}\nTaxa de entrega: R$ 5,00\nTotal a pagar: ${totalFinalFormatted}`;

    const messege = encodeURIComponent(messageText);
    const phone = "011960814357";

    window.open(`https://wa.me/${phone}?text=${messege}`, "_blank");

    cart.length = 0;
    updateCartModal();
})


//Verificara hora e manipular o card horario 
function checkRestaurantOpen(){
  const data = new Date();
  const hora = data.getHours();
  return hora >= 12 && hora < 24; //true restaurante esta aberto
}

const spanItem = document.getElementById("date-span")
const isOpen = checkRestaurantOpen();

if(isOpen){
  spanItem.classList.remove("bg-red-500");
  spanItem.classList.add("bg-green-600")
}
else{
  spanItem.classList.remove("bg-green-600");
  spanItem.classList.add("bg-red-500")
}

// Controlar campo de troco baseado no método de pagamento
const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
paymentMethods.forEach(method => {
  method.addEventListener('change', function() {
    if(changeField && changeAmountInput) {
      if(this.value === 'Dinheiro') {
        changeField.classList.remove('hidden');
        changeAmountInput.value = '';
      } else {
        changeField.classList.add('hidden');
        changeAmountInput.value = '';
        if(changeWarn) changeWarn.classList.add('hidden');
        changeAmountInput.classList.remove('border-red-500');
      }
    }
  });
});

// Remover aviso quando digitar no campo de troco
if(changeAmountInput) {
  changeAmountInput.addEventListener('input', function(e) {
    if(e.target.value.trim() !== '') {
      changeAmountInput.classList.remove('border-red-500');
      if(changeWarn) changeWarn.classList.add('hidden');
    }
  });
}

// Anualizar rodapé
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

// Animar card flutuante (scale + fade) e mostrar somente em telas >= sm
document.addEventListener('DOMContentLoaded', function(){
  const contactFloat = document.getElementById('contact-float');
  if(contactFloat){
    // pequeno delay para permitir a transição
    setTimeout(() => {
      contactFloat.classList.remove('opacity-0','scale-95');
    }, 150);
  }
  // garantir estado inicial do botão de checkout
  if (typeof updateCartModal === 'function') updateCartModal();
  // adicionar title/aria-label aos botões de adicionar ao carrinho existentes
  const addButtons = document.querySelectorAll('.add-to-card-btn');
  addButtons.forEach(btn => {
    const name = btn.dataset.name || 'item';
    const label = `Adicionar ${name} ao carrinho`;
    if(!btn.getAttribute('title')) btn.setAttribute('title', label);
    if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', label);
  });
  // label para o botão do carrinho (abrir)
  const cartOpenBtn = document.getElementById('cart-btn');
  if(cartOpenBtn && !cartOpenBtn.getAttribute('aria-label')) cartOpenBtn.setAttribute('aria-label','Abrir carrinho');
  // (nav hamburger removed) nothing else to init here
  
  // Inicializar carrossel
  initCarousel();
});

// Função para inicializar o carrossel de imagens
function initCarousel() {
  const carouselWrapper = document.querySelector('.carousel-wrapper');
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const indicators = document.querySelectorAll('.carousel-indicator');
  
  if (!carouselWrapper || carouselSlides.length === 0) return;
  
  let currentSlide = 0;
  const totalSlides = carouselSlides.length;
  let autoSlideInterval;
  
  // Função para atualizar a posição do carrossel
  function updateCarousel() {
    const translateX = -currentSlide * 100;
    carouselWrapper.style.transform = `translateX(${translateX}%)`;
    
    // Atualizar indicadores
    indicators.forEach((indicator, index) => {
      if (index === currentSlide) {
        indicator.classList.add('bg-white', 'w-8');
        indicator.classList.remove('bg-white/60', 'w-2');
      } else {
        indicator.classList.remove('bg-white', 'w-8');
        indicator.classList.add('bg-white/60', 'w-2');
      }
    });
  }
  
  // Função para ir para o próximo slide
  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
  }
  
  // Função para ir para o slide anterior
  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
  }
  
  // Função para ir para um slide específico
  function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
  }
  
  // Função para iniciar o slide automático
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 4000); // Muda a cada 4 segundos
  }
  
  // Função para parar o slide automático
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
    }
  }
  
  // Event listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoSlide();
      startAutoSlide(); // Reinicia o auto-slide
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoSlide();
      startAutoSlide(); // Reinicia o auto-slide
    });
  }
  
  // Event listeners para os indicadores
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
      stopAutoSlide();
      startAutoSlide(); // Reinicia o auto-slide
    });
  });
  
  // Pausar auto-slide ao passar o mouse sobre o carrossel
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoSlide);
    carouselContainer.addEventListener('mouseleave', startAutoSlide);
  }
  
  // Inicializar
  updateCarousel();
  startAutoSlide();
  
  // Suporte para touch/swipe (opcional, para dispositivos móveis)
  let touchStartX = 0;
  let touchEndX = 0;
  
  if (carouselContainer) {
    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    carouselContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }
  
  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      // Swipe para a esquerda - próximo slide
      nextSlide();
      stopAutoSlide();
      startAutoSlide();
    }
    if (touchEndX > touchStartX + 50) {
      // Swipe para a direita - slide anterior
      prevSlide();
      stopAutoSlide();
      startAutoSlide();
    }
  }
}
