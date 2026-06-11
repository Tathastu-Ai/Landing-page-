// ======== SUPABASE CONFIGURATION ========
// Replace 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY' with your actual Supabase credentials.
const SUPABASE_URL = 'https://ntvjfremtoqcuyecdrxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lNReTjzZYKrpA7_MPBJxHA_Kk8oCbOw';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ======== HERO BACKGROUND: IMAGE FIRST, THEN VIDEO ========
(function () {
  const vc = document.getElementById('video-container');
  const bgImage = document.getElementById('heroBgImage');

  if (vc) {
    const isMobile = window.innerWidth <= 767;
    const v = document.createElement('video');
    v.src = isMobile ? 'assets/demo-video.mp4' : 'assets/hero-video.mp4';
    v.autoplay = true;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');

    // When the video can play, fade it in and fade out the image
    v.addEventListener('canplaythrough', function () {
      vc.appendChild(v);
      // Small delay so the video element is in the DOM and rendering
      requestAnimationFrame(() => {
        vc.classList.add('visible');
        // Once video is visible, hide the background image
        if (bgImage) {
          bgImage.classList.add('hidden');
        }
      });
    }, { once: true });

    // Fallback: if video takes too long (10s), still show video
    setTimeout(() => {
      if (!vc.classList.contains('visible') && v.readyState >= 2) {
        vc.appendChild(v);
        vc.classList.add('visible');
        if (bgImage) {
          bgImage.classList.add('hidden');
        }
      }
    }, 10000);

    // Start loading
    v.load();
  }
})();

// ======== NAVBAR SCROLL EFFECT ========
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ======== SCROLL REVEAL ========
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ======== FAQ ACCORDION ========
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');

  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    // Close all other items
    faqItems.forEach(other => {
      if (other !== item) {
        other.classList.remove('active');
        other.querySelector('.faq-answer').style.maxHeight = '0';
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle current
    if (isActive) {
      item.classList.remove('active');
      answer.style.maxHeight = '0';
      question.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('active');
      answer.style.maxHeight = answer.scrollHeight + 'px';
      question.setAttribute('aria-expanded', 'true');
    }
  });
});

// ======== RESEND EMAIL ========
// Note: Calling Resend directly from the frontend might fail due to CORS and exposes your API key.
// It is recommended to move this to a backend or serverless function (like Supabase Edge Functions) in production.
async function sendConfirmationEmail(name, email, country, referral) {
  try {
    // Call our simple local Node.js backend
    const response = await fetch('http://localhost:3000/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, country, referral })
    });

    if (!response.ok) {
      console.error('Backend returned an error:', await response.text());
      return;
    }
    
    console.log('Confirmation email triggered successfully via simple backend.');
  } catch (err) {
    console.error('Error connecting to backend:', err);
  }
}

// ======== FORM HANDLER ========
const form = document.getElementById('earlyAccessForm');
const countrySelect = document.getElementById('country');
const otherCountryGroup = document.getElementById('otherCountryGroup');
const otherCountryInput = document.getElementById('otherCountry');

const referralRadios = document.querySelectorAll('input[name="referral"]');
const otherReferralGroup = document.getElementById('otherReferralGroup');
const otherReferralInput = document.getElementById('otherReferral');

const agreeCheckbox = document.getElementById('agreeCheckbox');
const submitBtn = document.getElementById('submitBtn');

// Country Select conditional show/hide
countrySelect.addEventListener('change', () => {
  if (countrySelect.value === 'other') {
    otherCountryGroup.classList.add('show');
    otherCountryInput.required = true;
    otherCountryInput.focus();
  } else {
    otherCountryGroup.classList.remove('show');
    otherCountryInput.required = false;
    otherCountryInput.value = '';
  }
});

// Referral Radio conditional show/hide
referralRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const selectedReferral = document.querySelector('input[name="referral"]:checked');
    if (selectedReferral && selectedReferral.value === 'other') {
      otherReferralGroup.classList.add('show');
      otherReferralInput.required = true;
      otherReferralInput.focus();
    } else {
      otherReferralGroup.classList.remove('show');
      otherReferralInput.required = false;
      otherReferralInput.value = '';
    }
  });
});

// Enable/Disable Submit Button based on Checkbox
agreeCheckbox.addEventListener('change', () => {
  submitBtn.disabled = !agreeCheckbox.checked;
});

// Reset logic
form.addEventListener('reset', () => {
  setTimeout(() => {
    otherCountryGroup.classList.remove('show');
    otherCountryInput.required = false;
    otherCountryInput.value = '';

    otherReferralGroup.classList.remove('show');
    otherReferralInput.required = false;
    otherReferralInput.value = '';

    submitBtn.disabled = !agreeCheckbox.checked;
  }, 0);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const originalText = submitBtn.textContent;

  submitBtn.textContent = 'Joining...';
  submitBtn.style.opacity = '0.7';
  submitBtn.disabled = true;

  const nameVal = document.getElementById('fullName').value.trim();
  const emailVal = document.getElementById('email').value.trim();

  let countryVal = countrySelect.value;
  if (countryVal === 'other') {
    countryVal = otherCountryInput.value.trim();
  }

  let referralVal = '';
  const selectedReferral = document.querySelector('input[name="referral"]:checked');
  if (selectedReferral) {
    if (selectedReferral.value === 'other') {
      referralVal = otherReferralInput.value.trim();
    } else {
      const val = selectedReferral.value;
      if (val === 'social') referralVal = 'Social Media';
      else if (val === 'search') referralVal = 'Search Engine';
      else if (val === 'friend') referralVal = 'Friend/Word of mouth';
      else referralVal = val;
    }
  }

  const showError = (msg) => {
    submitBtn.textContent = '✗ ' + msg;
    submitBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    submitBtn.style.opacity = '1';
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
    }, 4000);
  };

  const showSuccess = () => {
    // Hide form wrapper and show success wrapper
    const formWrapper = document.getElementById('formContentWrapper');
    const successWrapper = document.getElementById('successContentWrapper');
    
    if (formWrapper && successWrapper) {
      formWrapper.style.display = 'none';
      successWrapper.style.display = 'block';
      // Save state to local storage so it persists on refresh
      localStorage.setItem('tathastu_waitlist_joined', 'true');
    }
  };

  // Copy button logic
  const copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const copyText = document.getElementById('copyTextContent').innerText;
      navigator.clipboard.writeText(copyText).then(() => {
        const btnText = document.getElementById('copyBtnText');
        const originalBtnText = btnText.innerText;
        btnText.innerText = 'Copied!';
        setTimeout(() => {
          btnText.innerText = originalBtnText;
        }, 2000);
      });
    });
  }

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('waitlist')
        .insert([
          {
            name: nameVal,
            email: emailVal,
            country: countryVal,
            source: referralVal
          }
        ]);

      if (error) {
        throw error;
      }

      // Send confirmation email via Resend
      await sendConfirmationEmail(nameVal, emailVal, countryVal, referralVal);

      showSuccess();
    } catch (err) {
      console.error('Supabase error:', err);
      if (err.code === '23505' || (err.message && err.message.includes('duplicate key'))) {
        showError('Already registered!');
      } else {
        showError('Submission failed.');
      }
    }
  } else {
    console.warn("Supabase not initialized. Add your keys at the top of script.js.");
    setTimeout(() => {
      showSuccess();
    }, 800);
  }
});

// ======== SMOOTH SCROLL FOR ANCHOR LINKS ========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ======== CHECK LOCAL STORAGE ON LOAD ========
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('tathastu_waitlist_joined') === 'true') {
    const formWrapper = document.getElementById('formContentWrapper');
    const successWrapper = document.getElementById('successContentWrapper');
    if (formWrapper && successWrapper) {
      formWrapper.style.display = 'none';
      successWrapper.style.display = 'block';
    }
  }
});
