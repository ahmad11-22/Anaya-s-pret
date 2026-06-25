// 1. FIREBASE SDK IMPORTS 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 2. UI FUNCTIONS 
window.changeMainImage = function(imgSrc, thumbElement) {
    document.getElementById('main-product-image').src = imgSrc;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active-thumb'));
    thumbElement.classList.add('active-thumb');
}

// 3. FIREBASE CONFIGURATION (Fixed typo from Ds511 to DxS11)
const firebaseConfig = {
  apiKey: "AIzaSyDxS11IYmXCZml1YHhWn6AKfDrp6XANSFU",
  authDomain: "anaya-s-pret.firebaseapp.com",
  projectId: "anaya-s-pret",
  storageBucket: "anaya-s-pret.firebasestorage.app",
  messagingSenderId: "611584369776",
  appId: "1:611584369776:web:8823a5d8317ec9e92c80b5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); 

const myWhatsAppNumber = "923369871030"; 

let products = [];
let currentFilter = 'All';

// 4. START THE APP
async function startApp() {
    await fetchProductsFromCloud();
    setupAuthListener(); // Start listening for logins
    
    if(document.getElementById('product-grid')) {
        renderProducts();
        setupFilters();
    }
    if(document.getElementById('product-detail-container')) {
        renderProductDetails();
    }
    // Setup Admin Page specifically
    if(document.getElementById('admin-login-screen')) {
        setupLoginLogic();
        setupFileUploadFeedback();
        renderAdminInventory();
    }
}
startApp();

// --- AUTHENTICATION LOGIC ---

// Listen for Login/Logout changes
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        // Only run UI flipping if we are on the admin page
        const isAdminPage = window.location.pathname.includes('admin.html');
        
        if (isAdminPage) {
            const loginScreen = document.getElementById('admin-login-screen');
            const dashboard = document.getElementById('admin-dashboard');
            const logoutBtn = document.getElementById('logout-btn');

            if (user) {
                // User IS logged in: Hide Login, Show Dashboard & Logout
                if(loginScreen) loginScreen.style.display = 'none';
                if(dashboard) dashboard.style.display = 'block';
                if(logoutBtn) logoutBtn.style.display = 'inline-flex';
            } else {
                // User IS NOT logged in: Show Login, Hide Dashboard & Logout
                if(loginScreen) loginScreen.style.display = 'block';
                if(dashboard) dashboard.style.display = 'none';
                if(logoutBtn) logoutBtn.style.display = 'none';
            }
        }
    });
}

// Handle the Login Form submission
function setupLoginLogic() {
    const loginForm = document.getElementById('login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorText = document.getElementById('login-error');
            const submitBtn = document.getElementById('login-submit-btn');

            errorText.style.display = 'none';
            submitBtn.innerText = "Verifying...";

            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginForm.reset();
            } catch (error) {
                errorText.innerText = "Incorrect Email or Password.";
                errorText.style.display = 'block';
            } finally {
                submitBtn.innerText = "Secure Login";
            }
        });
    }
}

// Handle Logout
window.logoutApp = async function() {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Error logging out.");
    }
}

// --- FETCH FROM CLOUD ---
async function fetchProductsFromCloud() {
    try {
        const querySnapshot = await getDocs(collection(db, "clothes"));
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error("Error connecting to Firebase: ", error);
    }
}

// --- HOME PAGE LOGIC ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = '';

    const filteredProducts = currentFilter === 'All' ? products : products.filter(p => p.category === currentFilter);

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px;"><h3 style="font-family:\'Playfair Display\', serif; font-size: 2rem; color: #888;">No items found in cloud storage.</h3></div>';
        return;
    }

    filteredProducts.forEach(product => {
        const mainImg = (product.images && product.images.length > 0) ? product.images[0] : 'https://via.placeholder.com/600';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <span class="badge">${product.category}</span>
            <div class="product-image-container" style="cursor:pointer;" onclick="window.location.href='product.html?id=${product.id}'">
                <img src="${mainImg}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">Rs. ${Number(product.price).toLocaleString()}</p>
                <button class="buy-now-btn" onclick="window.location.href='product.html?id=${product.id}'">
                    View Details
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderProducts();
        });
    });
}

function setupFileUploadFeedback() {
    const fileInput = document.getElementById('p-image-file');
    if(fileInput) {
        fileInput.addEventListener('change', function() {
            const feedback = document.getElementById('file-upload-feedback');
            if (this.files.length === 0) {
                feedback.innerText = "";
            } else if (this.files.length > 4) {
                feedback.innerText = `You selected ${this.files.length} images. Only the first 4 will be uploaded.`;
                feedback.style.color = "var(--danger)";
            } else {
                feedback.innerText = `Successfully selected ${this.files.length} image(s).`;
                feedback.style.color = "var(--whatsapp)";
            }
        });
    }
}

// --- PRODUCT DETAIL PAGE & ZOOM LOGIC ---
function renderProductDetails() {
    const container = document.getElementById('product-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); 
    
    const product = products.find(p => p.id === productId);

    if(!product) {
        container.innerHTML = "<h2 style='text-align:center;'>Product not found.</h2>";
        return;
    }

    const imagesArray = (product.images && product.images.length > 0) ? product.images : ['https://via.placeholder.com/600'];

    let thumbnailsHTML = '';
    imagesArray.forEach((img, index) => {
        thumbnailsHTML += `<img src="${img}" class="thumbnail ${index === 0 ? 'active-thumb' : ''}" onclick="changeMainImage('${img}', this)">`;
    });

    container.innerHTML = `
        <div class="gallery-container">
            <div class="zoom-container" id="zoom-container">
                <img src="${imagesArray[0]}" id="main-product-image" class="main-image" alt="${product.name}">
            </div>
            <div class="thumbnail-row">
                ${thumbnailsHTML}
            </div>
        </div>
        <div class="product-detail-info">
            <span class="badge">${product.category}</span>
            <h1>${product.name}</h1>
            <div class="price">Rs. ${Number(product.price).toLocaleString()}</div>
            <div class="desc">${product.desc}</div>
            
            <button class="buy-now-btn" style="padding: 18px; font-size: 16px; width: 100%; max-width: 300px;" id="cloud-buy-btn">
                <i class="fab fa-whatsapp" style="font-size:20px;"></i> Order via WhatsApp
            </button>
        </div>
    `;

    document.getElementById('cloud-buy-btn').onclick = () => buyNow(product.id);

    const zoomContainer = document.getElementById('zoom-container');
    const mainImage = document.getElementById('main-product-image');
    if (zoomContainer && mainImage) {
        zoomContainer.addEventListener('mousemove', function(e) {
            const rect = zoomContainer.getBoundingClientRect();
            const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
            mainImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        });
        zoomContainer.addEventListener('mouseleave', function() {
            mainImage.style.transformOrigin = 'center center';
        });
    }
}

function buyNow(productId) {
    const product = products.find(p => p.id === productId);
    if(product) {
        let rawMessage = `Hello! I would like to buy the following item:\n\n`;
        rawMessage += `*Item:* ${product.name}\n`;
        rawMessage += `*Category:* ${product.category}\n`;
        rawMessage += `*Price:* Rs. ${Number(product.price).toLocaleString()}\n\n`;
        rawMessage += `*Description:*\n${product.desc}\n\n`;
        rawMessage += `Please let me know how to proceed with payment and delivery details.`;

        window.open(`https://wa.me/${myWhatsAppNumber}?text=${encodeURIComponent(rawMessage)}`, '_blank');
    }
}

// --- ADMIN UPLOAD TO CLOUD ---
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.6)); 
        }
    }
}

const form = document.getElementById('add-product-form');
if(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('p-image-file');
        const files = Array.from(fileInput.files).slice(0, 4); 
        
        if (files.length === 0) { alert("Please select an image."); return; }

        const btn = document.querySelector('.save-btn');
        btn.innerText = "Uploading to Google Cloud...";
        btn.disabled = true;

        let compressedImages = [];
        let processedCount = 0;
        
        files.forEach(file => {
            compressImage(file, async (base64) => {
                compressedImages.push(base64);
                processedCount++;
                
                if(processedCount === files.length) {
                    try {
                        await addDoc(collection(db, "clothes"), {
                            name: document.getElementById('p-name').value,
                            price: document.getElementById('p-price').value,
                            category: document.getElementById('p-category').value,
                            images: compressedImages,
                            desc: document.getElementById('p-desc').value
                        });

                        form.reset();
                        document.getElementById('file-upload-feedback').innerText = ''; 
                        await fetchProductsFromCloud();
                        if(document.getElementById('product-grid')) renderProducts();
                        renderAdminInventory();
                        alert("Product saved globally to Cloud Database!");
                    } catch (error) {
                        alert("Upload Error: " + error.message);
                    } finally {
                        btn.innerText = "Add Product to Store";
                        btn.disabled = false;
                    }
                }
            });
        });
    });
}

function renderAdminInventory() {
    const container = document.getElementById('admin-inventory');
    if(!container) return;
    container.innerHTML = '';
    
    if(products.length === 0) {
        container.innerHTML = '<p>No items in inventory.</p>';
        return;
    }

    products.forEach(p => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div>
                <strong>${p.name}</strong> <span style="font-size: 12px; color: #888;">(${p.category})</span>
            </div>
            <button id="del-${p.id}"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(item);
        document.getElementById(`del-${p.id}`).onclick = () => deleteProduct(p.id, p.name);
    });
}

window.deleteProduct = async function(id, name) {
    if(confirm(`Are you sure you want to remove "${name}" from cloud storage?`)) {
        try {
            await deleteDoc(doc(db, "clothes", id));
            await fetchProductsFromCloud();
            if(document.getElementById('product-grid')) renderProducts();
            renderAdminInventory();
            alert("Deleted successfully from the database!");
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    }
}
