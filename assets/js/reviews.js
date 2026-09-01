/**
 * Selvarani Readymades - Customer Reviews System
 * Vanilla JavaScript communicating with Netlify Functions and PostgreSQL backend via Fetch API.
 */

(function () {
  'use strict';

  // State
  let currentRating = 0;
  let isSubmitting = false;
  let pendingReview = null;

  // DOM Elements
  const board = document.getElementById('board');
  const boardCount = document.getElementById('boardCount');
  const avgScore = document.getElementById('avgScore');
  const avgStars = document.getElementById('avgStars');
  const totalCount = document.getElementById('totalCount');
  const starPicker = document.getElementById('starPicker');
  const starButtons = Array.from(starPicker.querySelectorAll('button'));
  const form = document.getElementById('reviewForm');
  const nameInput = document.getElementById('nameInput');
  const textInput = document.getElementById('textInput');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');

  // Modal Elements
  const confirmModal = document.getElementById('confirmModal');
  const modalPreviewName = document.getElementById('modalPreviewName');
  const modalPreviewStars = document.getElementById('modalPreviewStars');
  const modalPreviewText = document.getElementById('modalPreviewText');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalError = document.getElementById('modalError');

  /**
   * Generates a string of filled and empty star characters.
   * @param {number} n
   * @returns {string}
   */
  function starString(n) {
    const rounded = Math.round(Number(n) || 0);
    const clamped = Math.max(0, Math.min(5, rounded));
    return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
  }

  /**
   * Updates visual star picker button states.
   * @param {number} val
   */
  function renderStars(val) {
    starButtons.forEach(btn => {
      const btnVal = Number(btn.dataset.val);
      const isActive = btnVal <= val;
      btn.textContent = isActive ? '★' : '☆';
      btn.classList.toggle('active', isActive);
    });
  }

  // Star picker events
  starButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => renderStars(Number(btn.dataset.val)));
    btn.addEventListener('mouseleave', () => renderStars(currentRating));
    btn.addEventListener('click', () => {
      currentRating = Number(btn.dataset.val);
      renderStars(currentRating);
      formError.classList.remove('show');
    });
  });

  /**
   * Formats ISO or PostgreSQL timestamp string into human-readable date.
   * @param {string} dateStr
   * @returns {string}
   */
  function fmtDate(dateStr) {
    if (!dateStr) return '';
    const normalized = dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Safely escapes HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /**
   * Fetches all reviews and shop statistics from Netlify Function.
   */
  async function loadReviews() {
    try {
      const response = await fetch('/api/get-reviews', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }

      renderHeroStats(data.total_reviews, data.average_rating);
      renderReviewsBoard(data.reviews);

    } catch (err) {
      console.error('Error loading reviews:', err);
      board.innerHTML = '<div class="empty-state">Unable to load reviews right now. Please refresh the page.</div>';
      boardCount.textContent = '';
      totalCount.textContent = '0';
      avgScore.textContent = '–';
      avgStars.textContent = '☆☆☆☆☆';
    }
  }

  /**
   * Renders the Hero summary statistics.
   * @param {number} totalReviews
   * @param {number} averageRating
   */
  function renderHeroStats(totalReviews, averageRating) {
    const count = Number(totalReviews) || 0;
    const avg = Number(averageRating) || 0;

    totalCount.textContent = count;
    boardCount.textContent = count + (count === 1 ? ' review' : ' reviews');

    if (count > 0) {
      avgScore.textContent = avg.toFixed(1);
      avgStars.textContent = starString(avg);
    } else {
      avgScore.textContent = '–';
      avgStars.textContent = '☆☆☆☆☆';
    }
  }

  /**
   * Renders review cards into the "What customers are saying" section.
   * @param {Array} reviews
   */
  function renderReviewsBoard(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      board.innerHTML = '<div class="empty-state">No reviews yet — be the first to write one.</div>';
      return;
    }

    board.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">${starString(r.rating)}</div>
        <p class="review-body">${escapeHtml(r.review_text)}</p>
        <div class="review-foot">
          <span class="review-name">${escapeHtml(r.name)}</span>
          <span class="review-date">${fmtDate(r.created_at)}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Opens the confirmation modal with preview data.
   */
  function openConfirmModal(review) {
    pendingReview = review;
    modalPreviewName.textContent = review.name;
    modalPreviewStars.textContent = starString(review.rating);
    modalPreviewText.textContent = `“${review.review_text}”`;
    modalError.classList.remove('show');
    modalError.textContent = '';

    modalConfirmBtn.disabled = false;
    modalConfirmBtn.textContent = 'Confirm & Post';
    modalCancelBtn.disabled = false;

    confirmModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Closes the confirmation modal.
   */
  function closeConfirmModal() {
    if (isSubmitting) return;
    confirmModal.classList.remove('active');
    document.body.style.overflow = '';
    pendingReview = null;
  }

  // Initial Form Submit Handler -> Triggers Validation and Confirmation Modal
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formSuccess.classList.remove('show');

    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text || currentRating === 0) {
      formError.textContent = 'Add your name, a rating, and a few words first.';
      formError.classList.add('show');
      return;
    }

    if (name.length > 60) {
      formError.textContent = 'Name cannot exceed 60 characters.';
      formError.classList.add('show');
      return;
    }

    if (text.length > 2000) {
      formError.textContent = 'Review text cannot exceed 2000 characters.';
      formError.classList.add('show');
      return;
    }

    openConfirmModal({
      name: name,
      rating: currentRating,
      review_text: text
    });
  });

  // Modal Cancel Button
  modalCancelBtn.addEventListener('click', closeConfirmModal);

  // Close modal when clicking on overlay background (unless submitting)
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal && !isSubmitting) {
      closeConfirmModal();
    }
  });

  // Modal Confirm & Post Button -> Sends to Netlify Function via POST Fetch
  modalConfirmBtn.addEventListener('click', async () => {
    if (isSubmitting || !pendingReview) return;

    isSubmitting = true;
    modalConfirmBtn.disabled = true;
    modalCancelBtn.disabled = true;
    modalConfirmBtn.textContent = 'Posting...';
    modalError.classList.remove('show');

    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(pendingReview)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit review.');
      }

      // Success: Close modal, reset form, reload reviews from PostgreSQL
      isSubmitting = false;
      closeConfirmModal();

      form.reset();
      currentRating = 0;
      renderStars(0);

      formSuccess.textContent = 'Posted — thank you.';
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 3500);

      // Re-fetch all reviews and updated stats immediately
      await loadReviews();

    } catch (err) {
      console.error('Submission error:', err);
      isSubmitting = false;
      modalConfirmBtn.disabled = false;
      modalCancelBtn.disabled = false;
      modalConfirmBtn.textContent = 'Confirm & Post';

      modalError.textContent = err.message || 'Could not save your review. Please try again.';
      modalError.classList.add('show');
    }
  });

  // Initial Load on Page Mount
  loadReviews();

})();
