import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from './toast.js';

/**
 * Add / Edit Memory Modal Component (Admin Only)
 */
export function openMemoryModal(memoryToEdit = null, onSaveSuccess) {
  const currentUser = state.get().user;
  if (currentUser?.role !== 'admin') {
    showToast('Only admin can add or edit memories.', 'error');
    return;
  }

  let backdrop = document.getElementById('edit-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'edit-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }

  const isEditing = Boolean(memoryToEdit);
  const initialDate = memoryToEdit?.date || new Date().toISOString().split('T')[0];
  const initialTitle = memoryToEdit?.title || '';
  const initialStory = memoryToEdit?.story || '';
  const initialLocation = memoryToEdit?.location || '';
  let photos = Array.isArray(memoryToEdit?.photos) ? [...memoryToEdit.photos] : [];
  let attachedSong = memoryToEdit?.song || null;

  backdrop.innerHTML = `
    <div class="modal-card">
      <button class="modal-close-btn" id="btn-close-edit">✕</button>

      <div style="margin-bottom: 24px;">
        <span class="eyebrow">${isEditing ? 'Revise Moment' : 'Capture A New Moment'}</span>
        <h2 style="font-family: var(--font-hand); font-size: 2.4rem; color: var(--rose-dark);">
          ${isEditing ? 'Edit Memory' : 'Add New Memory'}
        </h2>
      </div>

      <form id="memory-form">
        <!-- Date & Location -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="mem-date">Date</label>
            <input type="date" id="mem-date" class="form-input" required value="${initialDate}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="mem-location">Location (Optional)</label>
            <input type="text" id="mem-location" class="form-input" placeholder="e.g. Parcafe, Hyde Park" value="${initialLocation}" />
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label class="form-label" for="mem-title">Title</label>
          <input type="text" id="mem-title" class="form-input" required placeholder="e.g. The First Cafe Date" value="${initialTitle}" />
        </div>

        <!-- Story Text -->
        <div class="form-group">
          <label class="form-label" for="mem-story">Story / Notes</label>
          <textarea id="mem-story" class="form-textarea" placeholder="Write the little details you never want to forget...">${initialStory}</textarea>
        </div>

        <!-- Photos Section (Saved to /uploads) -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="margin-bottom: 0;">Photos</label>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-muted);">
              Saved into local <code>uploads/</code> folder
            </span>
          </div>

          <div class="dropzone" id="photo-dropzone">
            <input type="file" id="photo-file-input" multiple accept="image/*" style="display: none;" />
            <div style="font-size: 1.8rem; margin-bottom: 6px;">📷</div>
            <p style="font-size: 0.95rem; color: var(--ink-soft); font-weight: 500;">
              Click to choose photos, or drag & drop here
            </p>
            <div style="margin-top: 10px;">
              <button type="button" class="btn btn-secondary" id="btn-select-photos" style="padding: 6px 16px; font-size: 0.8rem;">
                Browse Image Files
              </button>
            </div>
          </div>

          <div id="upload-status-msg" style="display: none; font-size: 0.82rem; margin-top: 8px; color: var(--rose-dark); font-family: var(--font-mono);"></div>

          <div class="photo-preview-grid" id="photo-preview-grid"></div>
        </div>

        <!-- Spotify Song Attachment Section (Admin only) -->
        <div class="form-group" style="position: relative; margin-top: 24px; padding-top: 20px; border-top: 1px dashed var(--thread);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label class="form-label" style="margin-bottom: 0;">Attached Spotify Song</label>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--rose-dark);">Admin Feature</span>
          </div>

          <!-- Selected Song Display -->
          <div id="selected-song-card" style="margin-bottom: 12px; display: none;">
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--paper); border: 1px solid var(--paper-border); padding: 12px 16px; border-radius: var(--radius-md);">
              <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                <img id="sel-song-art" src="" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" />
                <div style="min-width: 0;">
                  <div id="sel-song-title" style="font-weight: 600; font-size: 0.92rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                  <div id="sel-song-artist" style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--ink-soft);"></div>
                </div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button type="button" class="btn btn-secondary" id="btn-change-song" style="padding: 5px 12px; font-size: 0.75rem;">
                  Change Song
                </button>
                <button type="button" class="btn btn-secondary" id="btn-remove-song" style="padding: 5px 12px; font-size: 0.75rem; color: var(--rose-dark); border-color: rgba(180, 72, 91, 0.3);">
                  Remove Song
                </button>
              </div>
            </div>
          </div>

          <!-- Song Search Input Container -->
          <div id="song-search-box-container">
            <div style="display: flex; gap: 8px;">
              <input type="text" id="song-search-input" class="form-input" placeholder="Search track title, artist, or paste Spotify track URL..." />
            </div>
            <div id="song-search-dropdown" class="song-search-results" style="display: none;"></div>
            <span style="display: block; font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-muted); margin-top: 5px;">
              Type a title to search Spotify catalog, or paste a Spotify link (e.g. open.spotify.com/track/...)
            </span>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-edit">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-memory">
            ${isEditing ? 'Save Changes' : 'Save Memory'}
          </button>
        </div>
      </form>
    </div>
  `;

  const form = backdrop.querySelector('#memory-form');
  const dropzone = backdrop.querySelector('#photo-dropzone');
  const fileInput = backdrop.querySelector('#photo-file-input');
  const selectPhotosBtn = backdrop.querySelector('#btn-select-photos');
  const previewGrid = backdrop.querySelector('#photo-preview-grid');
  const uploadMsg = backdrop.querySelector('#upload-status-msg');

  const songSearchContainer = backdrop.querySelector('#song-search-box-container');
  const songInput = backdrop.querySelector('#song-search-input');
  const songDropdown = backdrop.querySelector('#song-search-dropdown');
  const selectedSongCard = backdrop.querySelector('#selected-song-card');
  const selArt = backdrop.querySelector('#sel-song-art');
  const selTitle = backdrop.querySelector('#sel-song-title');
  const selArtist = backdrop.querySelector('#sel-song-artist');
  const changeSongBtn = backdrop.querySelector('#btn-change-song');
  const removeSongBtn = backdrop.querySelector('#btn-remove-song');

  // Render photo previews
  function renderPreviews() {
    previewGrid.innerHTML = photos.map((src, idx) => `
      <div class="photo-preview-item" title="${src}">
        <img src="${src}" alt="Preview ${idx + 1}" />
        <button type="button" class="photo-remove-btn" data-index="${idx}" title="Remove photo">✕</button>
      </div>
    `).join('');

    previewGrid.querySelectorAll('.photo-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index, 10);
        photos.splice(idx, 1);
        renderPreviews();
      });
    });
  }
  renderPreviews();

  // Handle Photo Upload via API
  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    uploadMsg.style.display = 'block';
    uploadMsg.style.color = 'var(--ink-soft)';
    uploadMsg.textContent = 'Uploading and saving to uploads/ folder...';

    try {
      const res = await api.uploadPhotos(files);
      if (res.urls && res.urls.length > 0) {
        photos.push(...res.urls);
        renderPreviews();
        uploadMsg.style.color = '#234E35';
        uploadMsg.textContent = `✓ ${res.urls.length} photo(s) saved to uploads/ folder!`;
        showToast('Image saved to uploads/ folder', 'success');
      }
    } catch (err) {
      uploadMsg.style.color = 'var(--rose-dark)';
      uploadMsg.textContent = 'Photo upload failed. You can retry without losing your memory text.';
      showToast(err.message || 'Upload failed', 'error');
    }
  }

  selectPhotosBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // Song selection UI
  function updateSongCard() {
    if (attachedSong) {
      selArt.src = attachedSong.albumArt || '/uploads/PXL_20260616_202304977.jpg';
      selTitle.textContent = attachedSong.name || 'Unknown Track';
      selArtist.textContent = attachedSong.artist || 'Unknown Artist';
      selectedSongCard.style.display = 'block';
      songSearchContainer.style.display = 'none';
    } else {
      selectedSongCard.style.display = 'none';
      songSearchContainer.style.display = 'block';
    }
  }
  updateSongCard();

  changeSongBtn.addEventListener('click', () => {
    songSearchContainer.style.display = 'block';
    songInput.value = '';
    songInput.focus();
  });

  removeSongBtn.addEventListener('click', () => {
    attachedSong = null;
    updateSongCard();
    showToast('Song removed from memory', 'info');
  });

  // Helper: Attach Track
  function attachTrack(track) {
    attachedSong = {
      id: track.id,
      uri: track.uri || `spotify:track:${track.id}`,
      name: track.name,
      artist: track.artist,
      albumArt: track.albumArt
    };
    updateSongCard();
    songDropdown.style.display = 'none';
    songInput.value = '';
    showToast(`Attached "${track.name}"`, 'success');
  }

  // Live Spotify Search & Link parser
  let searchTimeout = null;
  songInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = songInput.value.trim();

    if (!q) {
      songDropdown.style.display = 'none';
      return;
    }

    // Check if pasted direct Spotify track URL
    const trackUrlMatch = q.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    const trackUriMatch = q.match(/spotify:track:([a-zA-Z0-9]+)/);
    const directTrackId = trackUrlMatch ? trackUrlMatch[1] : trackUriMatch ? trackUriMatch[1] : null;

    if (directTrackId) {
      attachTrack({
        id: directTrackId,
        uri: `spotify:track:${directTrackId}`,
        name: 'Spotify Track',
        artist: 'Attached via Link',
        albumArt: '/uploads/PXL_20260616_202304977.jpg'
      });
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const res = await api.searchSpotify(q);
        const tracks = res.tracks || [];

        if (tracks.length === 0) {
          songDropdown.innerHTML = `<div style="padding: 12px; font-size: 0.85rem; color: var(--ink-soft); text-align: center;">No tracks found for "${q}"</div>`;
          songDropdown.style.display = 'block';
          return;
        }

        songDropdown.innerHTML = tracks.map((t) => `
          <div class="song-result-item" data-json='${JSON.stringify(t).replace(/'/g, "&#39;")}'>
            <img class="song-result-art" src="${t.albumArt || ''}" alt="${t.name}" />
            <div class="song-result-details">
              <div class="song-result-name">${t.name}</div>
              <div class="song-result-artist">${t.artist}</div>
            </div>
            <button type="button" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">Attach</button>
          </div>
        `).join('');

        songDropdown.querySelectorAll('.song-result-item').forEach(item => {
          item.addEventListener('click', () => {
            const track = JSON.parse(item.dataset.json);
            attachTrack(track);
          });
        });

        songDropdown.style.display = 'block';
      } catch (err) {
        console.warn('Spotify search error:', err.message);
      }
    }, 320);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!songInput.contains(e.target) && !songDropdown.contains(e.target)) {
      songDropdown.style.display = 'none';
    }
  });

  // Close modal logic
  function close() {
    backdrop.classList.remove('active');
  }

  backdrop.querySelector('#btn-close-edit')?.addEventListener('click', close);
  backdrop.querySelector('#btn-cancel-edit')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Submit logic
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('#btn-save-memory');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const memoryData = {
      date: form.querySelector('#mem-date').value,
      title: form.querySelector('#mem-title').value,
      story: form.querySelector('#mem-story').value,
      location: form.querySelector('#mem-location').value,
      photos,
      song: attachedSong
    };

    try {
      let saved;
      if (isEditing) {
        saved = await api.updateMemory(memoryToEdit.id, memoryData);
        showToast('Memory updated ✨', 'success');
      } else {
        saved = await api.createMemory(memoryData);
        showToast('New memory saved to our story ❤️', 'success');
      }

      close();
      if (onSaveSuccess) onSaveSuccess(saved.data);
    } catch (err) {
      showToast(err.message || 'Failed to save memory', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = isEditing ? 'Save Changes' : 'Save Memory';
    }
  });

  backdrop.classList.add('active');
}
