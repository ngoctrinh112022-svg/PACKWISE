const DEFAULT_PRODUCTS = [
  {id:"pw01",name:"Balo Trail 25L",price:399000,capacity:25,size:"46 × 29 × 17 cm",material:"Polyester",category:"travel",description:"Gọn nhẹ cho chuyến đi ngắn ngày và lịch trình linh hoạt.",color:"#315f4f",tag:"BÁN CHẠY",discount:20},
  {id:"pw02",name:"Balo Journey 30L",price:449000,capacity:30,size:"49 × 31 × 20 cm",material:"Polyester chống bám nước",category:"travel",description:"Không gian rộng rãi cho chuyến đi từ 2 đến 3 ngày.",color:"#bd7654",tag:"ĐI DU LỊCH",discount:15},
  {id:"pw03",name:"Balo Metro 20L",price:329000,capacity:20,size:"43 × 28 × 15 cm",material:"Vải Oxford",category:"daily",description:"Thiết kế đơn giản cho việc học tập và sử dụng mỗi ngày.",color:"#425c72",tag:"HẰNG NGÀY"},
  {id:"pw04",name:"Balo Cabin 28L",price:499000,capacity:28,size:"48 × 32 × 20 cm",material:"Polyester",category:"air",description:"Kiểu dáng gọn, phù hợp để tham khảo khi chuẩn bị hành lý bay.",color:"#68644f",tag:"CABIN READY"},
  {id:"pw05",name:"Balo Nomad 35L",price:599000,capacity:35,size:"52 × 33 × 22 cm",material:"Nylon",category:"travel",description:"Dung tích lớn hơn cho chuyến đi nhiều ngày, cần mang thêm đồ.",color:"#5c536f",tag:"NHIỀU KHÔNG GIAN",discount:10},
  {id:"pw06",name:"Balo Daily Move 18L",price:300000,capacity:18,size:"41 × 27 × 14 cm",material:"Vải Oxford",category:"daily",description:"Nhỏ gọn, tiện dụng cho lịch học và các hoạt động thường ngày.",color:"#7b8660",tag:"GỌN NHẸ"}
];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const discountedPrice = p => Math.round((Number(p.price)||0)*(1-(Number(p.discount)||0)/100));
const priceHtml = p => p.discount ? `<span class="old-price">${money(p.price)}</span><strong class="sale-price">${money(discountedPrice(p))}</strong><span class="discount-badge">-${p.discount}%</span>` : `<strong>${money(p.price)}</strong>`;
const money = n => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(n)||0);
const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
const write = (key,value) => localStorage.setItem(key,JSON.stringify(value));
function getProducts(){
 const saved=read("packwise_products",null);
 if(!Array.isArray(saved))return DEFAULT_PRODUCTS.map(p=>({...p}));
 return saved.map(p=>{const current={...p};const standard=DEFAULT_PRODUCTS.find(d=>d.id===p.id);if(standard){current.price=standard.price;current.discount=standard.discount||0;}return current;});
}
function getCart(){return read("packwise_cart",[]);}
const getItemPrice = p => p ? discountedPrice(p) : 0;
const COUPONS = {PACK10:10,PACK15:15,PACK20:20};
function notify(message){const t=$("#toast");if(!t)return;t.textContent=message;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),2400);}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function bagArt(product, index=0, small=false){return `<div class="${small?"mini-bag":"mini-bag"}" style="--bag:${escapeHtml(product.color||"#315f4f")}"><span class="mini-label">P</span></div>`;}
function initStore(){
 const grid=$("#productGrid"); if(!grid)return;
 let selectedCompare=[];
 const products=getProducts();
 let activeCoupon="";
 function renderSaleProducts(){
   const target=$("#saleProducts");if(!target)return;
   const sale=getProducts().filter(p=>p.visible!==false&&Number(p.discount)>0).sort((a,b)=>b.discount-a.discount);
   target.innerHTML=sale.length?sale.map(p=>`<article class="sale-card"><div class="sale-art" style="--bag:${escapeHtml(p.color||"#315f4f")}">${bagArt(p)}<span class="discount-badge">-${p.discount}%</span></div><div class="sale-card-info"><h3>${escapeHtml(p.name)}</h3><div class="sale-prices"><span class="old-price">${money(p.price)}</span><strong class="sale-price">${money(discountedPrice(p))}</strong></div><button class="add-btn" data-sale-add="${p.id}">Thêm vào giỏ</button></div></article>`).join(""):'<p class="muted">Hiện chưa có sản phẩm giảm giá.</p>';
 }
 function renderOrderLookup(orders){const area=$("#orderLookupResults");if(!area)return;if(!orders.length){area.innerHTML='<p class="muted">Chưa tìm thấy đơn hàng theo số điện thoại này.</p>';return;}area.innerHTML=orders.map(o=>`<article class="order-result-card"><div><span class="eyebrow">MÃ ĐƠN</span><h3>${escapeHtml(o.id)}</h3><p class="muted">${escapeHtml(o.createdAt||"")}</p></div><div><strong class="order-status">${escapeHtml(o.status||"Chờ xác nhận")}</strong><p>${(o.items||[]).map(i=>`${escapeHtml(i.name)} × ${i.qty}`).join("<br>")}</p><p>Tổng tiền: <strong>${money(o.total)}</strong></p>${o.coupon?`<p>Mã giảm giá: ${escapeHtml(o.coupon)}</p>`:""}</div></article>`).join("");}
 $("#orderLookupForm")?.addEventListener("submit",e=>{e.preventDefault();const phone=new FormData(e.target).get("phone").replace(/\s+/g,"");const orders=read("packwise_orders",[]).filter(o=>String(o.phone||"").replace(/\s+/g,"")===phone);renderOrderLookup(orders);});
 function renderProducts(){
   const q=$("#searchInput").value.trim().toLowerCase(), cat=$("#categoryFilter").value;
   const visible=getProducts().filter(p=>p.visible!==false && (!q||p.name.toLowerCase().includes(q)||p.description.toLowerCase().includes(q)) && (cat==="all"||p.category===cat));
   grid.innerHTML=visible.map((p,i)=>`<article class="product-card">
    <div class="product-art tone-${(i%6)+1}" style="--bag:${escapeHtml(p.color||"#315f4f")}"><span class="product-tag">${escapeHtml(p.tag||"PACKWISE")}</span>${bagArt(p,i)}</div>
    <div class="product-info"><div class="product-topline"><h3>${escapeHtml(p.name)}</h3><span class="product-price">${priceHtml(p)}</span></div>
    <p class="product-description">${escapeHtml(p.description||"Balo tiện dụng cho nhu cầu hằng ngày.")}</p>
    <div class="spec-row"><span class="spec-pill">${p.capacity}L</span><span class="spec-pill">${escapeHtml(p.size)}</span></div>
    <div class="product-actions"><button class="add-btn" data-add="${p.id}">+ Thêm vào giỏ</button><button class="secondary-btn" data-detail="${p.id}">Chi tiết</button></div>
    <label class="compare-check"><input type="checkbox" data-compare="${p.id}" ${selectedCompare.includes(p.id)?"checked":""}> Chọn để so sánh</label></div></article>`).join("");
   $("#emptyState").classList.toggle("hidden",visible.length!==0);
   renderComparePicker();
 }
 function renderComparePicker(){
   const area=$("#comparePicker");if(!area)return;
   area.innerHTML=getProducts().filter(p=>p.visible!==false).map(p=>`<button class="compare-chip ${selectedCompare.includes(p.id)?"selected":""}" data-pick="${p.id}">${selectedCompare.includes(p.id)?"✓ ":""}${escapeHtml(p.name)}</button>`).join("");
 }
 function renderCompare(){
   const chosen=getProducts().filter(p=>selectedCompare.includes(p.id));
   const result=$("#compareResult");
   if(chosen.length<2){result.innerHTML='<p class="muted">Bà chọn ít nhất 2 balo để xem bảng so sánh nha.</p>';return;}
   result.innerHTML=`<table class="compare-table"><thead><tr><th>Tiêu chí</th>${chosen.map(p=>`<th>${escapeHtml(p.name)}</th>`).join("")}</tr></thead><tbody>
   <tr><th>Giá bán</th>${chosen.map(p=>`<td>${money(p.price)}</td>`).join("")}</tr>
   <tr><th>Dung tích</th>${chosen.map(p=>`<td>${p.capacity}L</td>`).join("")}</tr>
   <tr><th>Kích thước</th>${chosen.map(p=>`<td>${escapeHtml(p.size)}</td>`).join("")}</tr>
   <tr><th>Chất liệu</th>${chosen.map(p=>`<td>${escapeHtml(p.material)}</td>`).join("")}</tr></tbody></table>`;
 }
 function renderCart(){
   const cart=getCart(), products=getProducts();
   $("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);
   $("#cartTotal").textContent=money(cart.reduce((sum,x)=>{const p=products.find(p=>p.id===x.id);return sum+(p?getItemPrice(p)*x.qty:0)},0));
   const area=$("#cartItems");
   if(!cart.length){area.innerHTML='<div class="empty-state">Giỏ hàng đang trống.<br>Chọn chiếc balo bà thích rồi thêm vào nha.</div>';return;}
   area.innerHTML=cart.map(x=>{const p=products.find(p=>p.id===x.id);if(!p)return "";return `<div class="cart-line"><div class="cart-thumb">${bagArt(p,0,true)}</div><div><h4>${escapeHtml(p.name)}</h4><p>${p.discount?`<span class="old-price">${money(p.price)}</span> <strong class="sale-price">${money(discountedPrice(p))}</strong>`:money(p.price)}</p><div class="qty-controls"><button data-qty="${p.id}" data-delta="-1">−</button><span>${x.qty}</span><button data-qty="${p.id}" data-delta="1">+</button></div><button class="remove-btn" data-remove="${p.id}">Xóa sản phẩm</button></div><strong>${money(getItemPrice(p)*x.qty)}</strong></div>`}).join("");
 }
 function addToCart(id){const cart=getCart(), item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({id,qty:1});write("packwise_cart",cart);renderCart();notify("Đã thêm balo vào giỏ hàng.");}
 $("#saleProducts")?.addEventListener("click",e=>{const b=e.target.closest("[data-sale-add]");if(b)addToCart(b.dataset.saleAdd);});
 grid.addEventListener("click",e=>{
   const add=e.target.closest("[data-add]");if(add){addToCart(add.dataset.add);return;}
   const detail=e.target.closest("[data-detail]");if(detail){const p=getProducts().find(x=>x.id===detail.dataset.detail);if(p)alert(`${p.name}\nGiá: ${money(p.price)}\nDung tích: ${p.capacity}L\nKích thước: ${p.size}\nChất liệu: ${p.material}\n\n${p.description}`);return;}
 });
 grid.addEventListener("change",e=>{const cb=e.target.closest("[data-compare]");if(!cb)return;const id=cb.dataset.compare;if(cb.checked){if(selectedCompare.length>=3){cb.checked=false;notify("Chỉ so sánh tối đa 3 balo mỗi lần.");return;}if(!selectedCompare.includes(id))selectedCompare.push(id);}else selectedCompare=selectedCompare.filter(x=>x!==id);renderComparePicker();});
 $("#comparePicker").addEventListener("click",e=>{const b=e.target.closest("[data-pick]");if(!b)return;const id=b.dataset.pick;if(selectedCompare.includes(id))selectedCompare=selectedCompare.filter(x=>x!==id);else if(selectedCompare.length<3)selectedCompare.push(id);else{notify("Chỉ so sánh tối đa 3 balo mỗi lần.");return;}renderProducts();});
 $("#compareBtn").addEventListener("click",renderCompare);
 $("#searchInput").addEventListener("input",renderProducts);$("#categoryFilter").addEventListener("change",renderProducts);
 const drawer=$("#cartDrawer"), backdrop=$("#drawerBackdrop");
 function openCart(){drawer.classList.add("open");backdrop.classList.remove("hidden");}
 function closeCart(){drawer.classList.remove("open");backdrop.classList.add("hidden");}
 $("#cartToggle").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);backdrop.addEventListener("click",closeCart);
 $("#cartItems").addEventListener("click",e=>{
   const qty=e.target.closest("[data-qty]"),rem=e.target.closest("[data-remove]");
   if(qty){let cart=getCart(),item=cart.find(x=>x.id===qty.dataset.qty);if(item){item.qty+=Number(qty.dataset.delta);if(item.qty<=0)cart=cart.filter(x=>x.id!==qty.dataset.qty);write("packwise_cart",cart);renderCart();}}
   if(rem){write("packwise_cart",getCart().filter(x=>x.id!==rem.dataset.remove));renderCart();}
 });
 const modal=$("#checkoutModal");
 function updateCheckoutTotals(){const cart=getCart(),all=getProducts();const subtotal=cart.reduce((sum,x)=>{const p=all.find(y=>y.id===x.id);return sum+(p?getItemPrice(p)*x.qty:0)},0);const discount=Math.round(subtotal*(COUPONS[activeCoupon]||0)/100);$("#checkoutSubtotal").textContent=money(subtotal);$("#checkoutDiscount").textContent="−"+money(discount);$("#checkoutTotal").textContent=money(subtotal-discount);}
 $("#applyCouponBtn")?.addEventListener("click",()=>{const code=$("#couponSelect").value;if(!code){activeCoupon="";$("#couponMessage").textContent="Chưa áp dụng mã giảm giá.";updateCheckoutTotals();return;}if(!(code in COUPONS)){activeCoupon="";$("#couponMessage").textContent="Mã giảm giá không hợp lệ.";updateCheckoutTotals();return;}activeCoupon=code;$("#couponMessage").textContent=`Đã áp dụng ${code}: giảm ${COUPONS[code]}% trên tổng tiền sau giảm giá sản phẩm.`;updateCheckoutTotals();});
 $("#checkoutBtn").addEventListener("click",()=>{if(!getCart().length){notify("Giỏ hàng đang trống.");return;}activeCoupon="";$("#couponSelect").value="";$("#couponMessage").textContent="Chọn mã rồi nhấn “Áp dụng mã”.";updateCheckoutTotals();modal.classList.remove("hidden");});
 $("#closeCheckout").addEventListener("click",()=>modal.classList.add("hidden"));
 modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden");});
 $("#checkoutForm").addEventListener("submit",e=>{
   e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries()),cart=getCart(),all=getProducts();
   const items=cart.map(x=>{const p=all.find(y=>y.id===x.id);return p?{id:p.id,name:p.name,price:p.price,qty:x.qty}:null;}).filter(Boolean);
   const subtotal=items.reduce((sum,x)=>sum+getItemPrice(all.find(p=>p.id===x.id))*x.qty,0);const coupon=activeCoupon;const discount=Math.round(subtotal*(COUPONS[coupon]||0)/100);const total=subtotal-discount;
   const orders=read("packwise_orders",[]);
   orders.unshift({id:"PW"+Date.now().toString().slice(-7),customer:data.customerName,phone:data.phone,address:data.address,items:items.map(i=>({...i,price:getItemPrice(all.find(p=>p.id===i.id))})),subtotal,discount,coupon,total,status:"Chờ xác nhận",createdAt:new Date().toLocaleString("vi-VN")});
   write("packwise_orders",orders);write("packwise_cart",[]);e.target.reset();activeCoupon="";updateCheckoutTotals();$("#couponMessage").textContent="Chọn mã rồi nhấn “Áp dụng mã”.";modal.classList.add("hidden");renderCart();closeCart();notify("Đặt hàng thành công! Mã đơn: "+orders[0].id);
 });
 // Gợi ý dựa trên danh sách sản phẩm thực và tiêu chí khách hàng chọn.
 const recommendForm=$("#recommendForm"), recommendResults=$("#recommendResults");
 const previewSelect=$("#previewProductSelect"), previewBag=$("#previewBagArt"), previewInfo=$("#previewProductInfo");
 function getRecommendationScore(product,purpose,duration){
   let score=product.category===purpose?5:0;
   if(duration==="short")score+=product.capacity<=25?3:-1;
   else if(duration==="weekend")score+=product.capacity>=25&&product.capacity<=30?4:(product.capacity>30?1:0);
   else score+=product.capacity>=30?4:-1;
   if(purpose==="air"&&product.capacity<=30)score+=2;
   if(purpose==="daily"&&product.capacity<=20)score+=2;
   return score;
 }
 function renderRecommendation(event){
   if(event)event.preventDefault();
   const data=new FormData(recommendForm),purpose=data.get("purpose"),duration=data.get("duration"),budget=Number(data.get("budget"));
   const products=getProducts().filter(p=>p.visible!==false);
   const matching=products.filter(p=>p.price<=budget).map(p=>({...p,score:getRecommendationScore(p,purpose,duration)})).sort((a,b)=>b.score-a.score||a.price-b.price);
   const results=matching.length?matching:products.map(p=>({...p,score:getRecommendationScore(p,purpose,duration)})).sort((a,b)=>Math.abs(a.price-budget)-Math.abs(b.price-budget)||b.score-a.score).slice(0,3);
   if(!results.length){recommendResults.innerHTML='<div class="recommend-empty">Hiện chưa có sản phẩm nào trong danh sách để gợi ý.</div>';return;}
   recommendResults.innerHTML=`${matching.length?'':'<div class="recommend-empty">Chưa có mẫu nào nằm trong ngân sách đã chọn. Đây là những mẫu gần phù hợp nhất để bà tham khảo:</div>'}<div class="recommend-list">${results.slice(0,3).map(p=>`<article class="recommend-item"><div class="recommend-art" style="--bag:${escapeHtml(p.color||"#315f4f")}">${bagArt(p)}</div><div><h4>${escapeHtml(p.name)}</h4><p>${p.discount?`<span class="old-price">${money(p.price)}</span> <strong class="sale-price">${money(discountedPrice(p))}</strong>`:money(p.price)} · ${p.capacity}L · ${escapeHtml(p.size)}</p><button type="button" class="add-btn" data-recommend-add="${p.id}">Thêm vào giỏ</button></div></article>`).join("")}</div>`;
 }
 recommendForm.addEventListener("submit",renderRecommendation);
 recommendResults.addEventListener("click",e=>{const b=e.target.closest("[data-recommend-add]");if(b)addToCart(b.dataset.recommendAdd);});
 function renderProductPreview(){
   if(!previewSelect||!previewBag||!previewInfo)return;
   const products=getProducts().filter(p=>p.visible!==false),selected=products.find(p=>p.id===previewSelect.value)||products[0];
   if(!selected){previewInfo.innerHTML='<p class="muted">Chưa có sản phẩm để hiển thị.</p>';return;}
   previewSelect.value=selected.id;previewBag.style.setProperty("--bag",selected.color||"#315f4f");
   previewInfo.innerHTML=`<h4>${escapeHtml(selected.name)}</h4><p class="preview-price">${selected.discount?`<span class="old-price">${money(selected.price)}</span> <strong class="sale-price">${money(discountedPrice(selected))}</strong>`:money(selected.price)}</p><p>${selected.capacity}L · ${escapeHtml(selected.size)}</p><p>${escapeHtml(selected.material)}</p><p class="muted">${escapeHtml(selected.description||"")}</p><button type="button" class="add-btn" data-preview-add="${selected.id}">Thêm vào giỏ</button>`;
 }
 if(previewSelect){
   previewSelect.innerHTML=getProducts().filter(p=>p.visible!==false).map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
   previewSelect.addEventListener("change",()=>{renderProductPreview();updateArBagColor();});
   previewInfo.addEventListener("click",e=>{const b=e.target.closest("[data-preview-add]");if(b)addToCart(b.dataset.previewAdd);});
   renderProductPreview();
 }
 // Camera-based visual try-on demo: selected bag illustration is overlaid on the camera frame.
 const arVideo=$("#arCameraVideo"),arStart=$("#arStartCamera"),arStop=$("#arStopCamera"),arPlaceholder=$("#arCameraPlaceholder"),arOverlay=$("#arBagOverlay"),arMessage=$("#arCameraMessage");
 let arStream=null;
 function updateArBagColor(){if(!arOverlay||!previewSelect)return;const p=getProducts().find(x=>x.id===previewSelect.value);if(p)arOverlay.style.setProperty("--bag",p.color||"#315f4f");}
 async function startArCamera(){
   if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){if(arMessage)arMessage.textContent="Trình duyệt không hỗ trợ camera. Hãy mở website bằng localhost hoặc HTTPS trên trình duyệt mới.";return;}
   try{
     arStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});
     arVideo.srcObject=arStream;await arVideo.play();arPlaceholder?.classList.add("hidden");arVideo.classList.add("active");arOverlay?.classList.add("visible");if(arStart)arStart.disabled=true;if(arStop)arStop.disabled=false;if(arMessage)arMessage.textContent="Camera đang bật. Hình balo được hiển thị minh họa trên khung hình.";
   }catch(err){if(arMessage)arMessage.textContent=err&&err.name==="NotAllowedError"?"Bà cần cho phép trình duyệt truy cập camera để sử dụng tính năng này.":"Không mở được camera. Hãy kiểm tra camera hoặc mở website bằng localhost/HTTPS.";}
 }
 function stopArCamera(){if(arStream){arStream.getTracks().forEach(track=>track.stop());arStream=null;}if(arVideo){arVideo.pause();arVideo.srcObject=null;arVideo.classList.remove("active");}arPlaceholder?.classList.remove("hidden");arOverlay?.classList.remove("visible");if(arStart)arStart.disabled=false;if(arStop)arStop.disabled=true;if(arMessage)arMessage.textContent="Camera đang tắt. Chọn mẫu balo phía trên rồi bật camera.";}
 arStart?.addEventListener("click",startArCamera);arStop?.addEventListener("click",stopArCamera);window.addEventListener("pagehide",()=>{if(arStream)arStream.getTracks().forEach(track=>track.stop());});updateArBagColor();
 renderProducts();renderSaleProducts();renderCart();
}
function initAdmin(){
 const loginPanel=$("#loginPanel");if(!loginPanel)return;
 const adminPanel=$("#adminPanel");
 function showAdmin(){loginPanel.classList.add("hidden");adminPanel.classList.remove("hidden");renderAdmin();}
 $("#loginForm").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.target);if(d.get("username")==="admin"&&d.get("password")==="123456"){sessionStorage.setItem("packwise_admin","yes");showAdmin();notify("Đăng nhập mô phỏng thành công.");}else notify("Sai tài khoản hoặc mật khẩu.");});
 $("#logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("packwise_admin");adminPanel.classList.add("hidden");loginPanel.classList.remove("hidden");});
 if(sessionStorage.getItem("packwise_admin")==="yes")showAdmin();
 function renderAdmin(){
   const products=getProducts(),orders=read("packwise_orders",[]);
   $("#visibleProducts").textContent=products.filter(p=>p.visible!==false).length;$("#orderCount").textContent=orders.length;$("#orderValue").textContent=money(orders.reduce((s,o)=>s+o.total,0));
   $("#adminProductList").innerHTML=products.map(p=>`<div class="admin-product-row ${p.visible===false?"is-hidden":""}"><div><strong>${escapeHtml(p.name)} ${p.visible===false?"(Đang ẩn)":""}</strong><small>${money(p.price)} • ${p.capacity}L • ${escapeHtml(p.material)}</small></div><div class="admin-row-actions"><button data-edit="${p.id}">Sửa</button><button data-hide="${p.id}">${p.visible===false?"Hiện":"Ẩn"}</button><button class="danger" data-delete="${p.id}">Xóa</button></div></div>`).join("");
   $("#adminOrders").innerHTML=!orders.length?'<div class="admin-empty">Chưa có đơn hàng mô phỏng nào.</div>':`<table class="orders-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead><tbody>${orders.map(o=>`<tr><td>${escapeHtml(o.id)}<br><small>${escapeHtml(o.createdAt)}</small></td><td>${escapeHtml(o.customer)}<br><small>${escapeHtml(o.phone)}</small></td><td>${o.items.map(i=>`${escapeHtml(i.name)} × ${i.qty}`).join("<br>")}</td><td>${money(o.total)}</td><td><select class="status-select" data-status="${o.id}">${["Chờ xác nhận","Đang xử lý","Đang giao","Hoàn thành","Đã hủy"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table>`;
 }
 const form=$("#productForm");
 $("#resetProductForm").addEventListener("click",()=>{form.reset();form.elements.id.value="";$("#formTitle").textContent="Thêm sản phẩm";});
 form.addEventListener("submit",e=>{
   e.preventDefault();const d=Object.fromEntries(new FormData(form).entries()),products=getProducts();
   const product={id:d.id||"pw"+Date.now(),name:d.name.trim(),price:Number(d.price),capacity:Number(d.capacity),size:d.size.trim(),material:d.material.trim(),category:d.category,description:d.description.trim(),color:"#315f4f",tag:"PACKWISE",visible:true};
   const idx=products.findIndex(p=>p.id===product.id);if(idx>=0)products[idx]={...products[idx],...product};else products.unshift(product);
   write("packwise_products",products);form.reset();form.elements.id.value="";$("#formTitle").textContent="Thêm sản phẩm";renderAdmin();notify("Đã lưu sản phẩm.");
 });
 $("#adminProductList").addEventListener("click",e=>{
   const edit=e.target.closest("[data-edit]"),hide=e.target.closest("[data-hide]"),del=e.target.closest("[data-delete]");
   let products=getProducts();
   if(edit){const p=products.find(x=>x.id===edit.dataset.edit);if(!p)return;Object.entries({id:p.id,name:p.name,price:p.price,capacity:p.capacity,size:p.size,material:p.material,category:p.category,description:p.description}).forEach(([k,v])=>form.elements[k].value=v??"");$("#formTitle").textContent="Chỉnh sửa sản phẩm";form.scrollIntoView({behavior:"smooth",block:"start"});}
   if(hide){products=products.map(p=>p.id===hide.dataset.hide?{...p,visible:p.visible===false?true:false}:p);write("packwise_products",products);renderAdmin();notify("Đã cập nhật trạng thái hiển thị.");}
   if(del){const p=products.find(x=>x.id===del.dataset.delete);if(p&&confirm(`Xóa sản phẩm "${p.name}"?`)){write("packwise_products",products.filter(x=>x.id!==del.dataset.delete));renderAdmin();notify("Đã xóa sản phẩm.");}}
 });
 $("#adminOrders").addEventListener("change",e=>{const sel=e.target.closest("[data-status]");if(!sel)return;const orders=read("packwise_orders",[]).map(o=>o.id===sel.dataset.status?{...o,status:sel.value}:o);write("packwise_orders",orders);renderAdmin();notify("Đã cập nhật trạng thái đơn hàng.");});
}
document.addEventListener("DOMContentLoaded",()=>{initStore();initAdmin();});