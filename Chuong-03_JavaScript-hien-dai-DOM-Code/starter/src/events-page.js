// Trang lịch sự kiện: tải danh sách từ API, tìm theo tên, lọc theo CLB.
// Bộ lọc được ghi lên URL (?q=…&clubId=…) để tải lại trang hay gửi link cho bạn vẫn giữ kết quả.
import { getClubs, getEvents } from './api.js';
import { el, renderEventList, renderStatus } from './render.js';
import { debounce } from './utils/debounce.js';

const SEARCH_DELAY_MS = 300;

const filterForm = document.querySelector('.filters');
const searchInput = document.querySelector('#search');
const clubSelect = document.querySelector('#club-filter');
const eventList = document.querySelector('#event-list');
const resultCount = document.querySelector('#result-count');

/** id CLB → tên CLB, để card hiện "CLB Tin học" thay vì một chuỗi UUID */
const clubNames = new Map();

/** Request đang chạy. Có request mới thì huỷ request này (xem loadEvents). */
let currentController = null;

// ---- URL search params ----

function readFiltersFromUrl()
{
  const params = new URLSearchParams(window.location.search);
  return { q: params.get('q') ?? '', clubId: params.get('clubId') ?? '' };
}

function readFiltersFromForm()
{
  return { q: searchInput.value.trim(), clubId: clubSelect.value };
}

function writeFiltersToUrl({ q, clubId })
{
  const params = new URLSearchParams();
  if (q)
  {
    params.set('q', q);
  }
  if (clubId)
  {
    params.set('clubId', clubId);
  }
  const query = params.toString();
  window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}

// ---- Câu lạc bộ ----

async function loadClubs()
{
  try
  {
    const clubs = await getClubs();
    for (const club of clubs)
    {
      clubNames.set(club.id, club.name);
      clubSelect.append(el('option', { text: club.name, attrs: { value: club.id } }));
    }
  }
  catch (error)
  {
    console.warn('Không tải được danh sách CLB:', error.message);
  }
}

// ---- Sự kiện ----

function showEvents(page, { q })
{
  if (page.items.length === 0)
  {
    resultCount.textContent = '';
    const message = q ? `Không có sự kiện nào khớp "${q}".` : 'Chưa có sự kiện nào.';
    renderStatus(eventList, 'empty', message);
    return;
  }
  resultCount.textContent = `Tìm thấy ${page.totalCount} sự kiện`;
  renderEventList(eventList, page.items, clubNames);
}

async function loadEvents()
{
  const filters = readFiltersFromForm();
  writeFiltersToUrl(filters);

  currentController?.abort();
  const controller = new AbortController();
  currentController = controller;

  eventList.setAttribute('aria-busy', 'true');
  resultCount.textContent = '';
  renderStatus(eventList, 'loading', 'Đang tải sự kiện…');

  try
  {
    const page = await getEvents(filters, controller.signal);
    showEvents(page, filters);
  }
  catch (error)
  {
    if (error.name === 'AbortError')
    {
      return;
    }
    renderStatus(eventList, 'error', error.message, { label: 'Thử lại', onClick: loadEvents });
  }
  finally
  {
    if (currentController === controller)
    {
      eventList.setAttribute('aria-busy', 'false');
    }
  }
}

// ---- Gắn sự kiện ----

const loadEventsAfterTyping = debounce(loadEvents, SEARCH_DELAY_MS);

searchInput.addEventListener('input', loadEventsAfterTyping);
clubSelect.addEventListener('change', loadEvents);
filterForm.addEventListener('submit', (event) =>
{
  event.preventDefault();
  loadEvents();
});

async function init()
{
  const filters = readFiltersFromUrl();
  searchInput.value = filters.q;
  await loadClubs();
  clubSelect.value = filters.clubId;
  await loadEvents();
}

init();
