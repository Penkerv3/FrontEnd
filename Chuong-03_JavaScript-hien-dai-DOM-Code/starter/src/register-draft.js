const DRAFT_KEY = 'eduhub.registerDraft';

const DRAFT_FIELDS = ['studentId', 'name', 'email'];

export function saveDraft(form)
{
  const draft = {};
  for (const name of DRAFT_FIELDS)
  {
    draft[name] = form.elements[name].value;
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function restoreDraft(form)
{
  try
  {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY)) ?? {};
    for (const name of DRAFT_FIELDS)
    {
      if (typeof draft[name] === 'string')
      {
        form.elements[name].value = draft[name];
      }
    }
  }
  catch
  {
    clearDraft();
  }
}

export function clearDraft()
{
  localStorage.removeItem(DRAFT_KEY);
}
