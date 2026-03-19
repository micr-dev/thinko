import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { defaultIconState } from 'WinXP/apps';

const ROWS_PER_COLUMN = 11;

const DEFAULT_COMMISSION_FORM = {
  id: '',
  artistName: '',
  artistLink: '',
  date: '',
  description: '',
  row: '1',
  column: '1',
  imageDataUrl: '',
  imagePreviewUrl: '',
  imageName: '',
};

const RESERVED_SLOTS = new Map(
  defaultIconState.map(icon => [icon.gridIndex, icon.title]),
);

function DrawingsAdminPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [session, setSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [commissionForm, setCommissionForm] = useState(DEFAULT_COMMISSION_FORM);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');
  const [reasonById, setReasonById] = useState({});

  const authError = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    const code = search.get('error');

    switch (code) {
      case 'forbidden':
        return 'This GitHub account is not allowed to moderate drawings.';
      case 'oauth_failed':
        return 'GitHub sign-in failed. Try again.';
      case 'oauth_state':
        return 'GitHub sign-in expired. Start the sign-in flow again.';
      case 'oauth_unconfigured':
        return 'GitHub OAuth is not configured yet. Add the GitHub env vars before using moderation.';
      default:
        return '';
    }
  }, []);

  const slotMeta = useMemo(() => {
    const row = Number(commissionForm.row);
    const column = Number(commissionForm.column);
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(column) ||
      row < 1 ||
      column < 1
    ) {
      return {
        gridIndex: null,
        message: 'enter a valid row and column',
      };
    }

    const gridIndex = (column - 1) * ROWS_PER_COLUMN + (row - 1);
    const reservedLabel = RESERVED_SLOTS.get(gridIndex);
    if (reservedLabel) {
      return {
        gridIndex,
        message: `occupied by ${reservedLabel}`,
      };
    }

    const commissionOccupant = commissions.find(
      commission =>
        commission.id !== commissionForm.id &&
        commission.gridIndex === gridIndex,
    );

    return {
      gridIndex,
      message: commissionOccupant
        ? `occupied by ${commissionOccupant.artistName}`
        : 'slot is available',
    };
  }, [
    commissionForm.column,
    commissionForm.id,
    commissionForm.row,
    commissions,
  ]);

  const loadDashboard = useCallback(async () => {
    const [submissionsResponse, commissionsResponse] = await Promise.all([
      fetch('/api/admin/drawings/submissions', {
        credentials: 'same-origin',
        cache: 'no-store',
      }),
      fetch('/api/admin/commissions', {
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    ]);

    if (!submissionsResponse.ok) {
      throw new Error('Failed to load drawing submissions');
    }
    if (!commissionsResponse.ok) {
      throw new Error('Failed to load commissions');
    }

    const [submissionsData, commissionsData] = await Promise.all([
      submissionsResponse.json(),
      commissionsResponse.json(),
    ]);

    setSubmissions(submissionsData.submissions || []);
    setCommissions(commissionsData.commissions || []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        const sessionResponse = await fetch('/api/admin/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (sessionResponse.status === 401) {
          window.location.assign('/api/admin/oauth/github/start');
          return;
        }

        if (!sessionResponse.ok) {
          throw new Error('Failed to verify admin session');
        }

        const sessionData = await sessionResponse.json();
        if (!isMounted) return;

        setSession(sessionData);
        await loadDashboard();
        if (!isMounted) return;
        setIsCheckingSession(false);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.message);
        setIsCheckingSession(false);
      }
    }

    boot();
    return () => {
      isMounted = false;
    };
  }, [loadDashboard]);

  async function reviewSubmission(id, status) {
    setActionId(id);
    setError('');

    try {
      const endpoint =
        status === 'approved'
          ? '/api/admin/drawings/approve'
          : '/api/admin/drawings/reject';
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          reason: reasonById[id] || '',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Moderation update failed');
      }

      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionId('');
    }
  }

  async function onLogout() {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    window.location.assign('/');
  }

  function resetCommissionForm() {
    setCommissionForm(DEFAULT_COMMISSION_FORM);
  }

  function editCommission(commission) {
    const row = (commission.gridIndex % ROWS_PER_COLUMN) + 1;
    const column = Math.floor(commission.gridIndex / ROWS_PER_COLUMN) + 1;

    setCommissionForm({
      id: commission.id,
      artistName: commission.artistName,
      artistLink: commission.artistLink || '',
      date: commission.date || '',
      description: commission.description || '',
      row: String(row),
      column: String(column),
      imageDataUrl: '',
      imagePreviewUrl: commission.imageUrl || '',
      imageName: '',
    });
  }

  async function onCommissionFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setError('Commission image must be a PNG or JPG');
      return;
    }

    const imageDataUrl = await readFileAsDataUrl(file);
    setCommissionForm(current => ({
      ...current,
      imageDataUrl,
      imagePreviewUrl: imageDataUrl,
      imageName: file.name,
    }));
  }

  async function saveCommission() {
    setError('');
    setActionId('commission-save');

    try {
      if (!slotMeta.message || slotMeta.gridIndex === null) {
        throw new Error('A valid desktop position is required');
      }

      if (slotMeta.message !== 'slot is available') {
        throw new Error(slotMeta.message);
      }

      const response = await fetch('/api/admin/commissions', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commissionForm.id || undefined,
          artistName: commissionForm.artistName,
          artistLink: commissionForm.artistLink,
          date: commissionForm.date,
          description: commissionForm.description,
          gridIndex: slotMeta.gridIndex,
          imageDataUrl: commissionForm.imageDataUrl || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Commission save failed');
      }

      await loadDashboard();
      resetCommissionForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionId('');
    }
  }

  async function removeCommission(id) {
    setError('');
    setActionId(`commission-delete-${id}`);

    try {
      const response = await fetch('/api/admin/commissions/delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Commission delete failed');
      }

      await loadDashboard();
      if (commissionForm.id === id) {
        resetCommissionForm();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionId('');
    }
  }

  if (isCheckingSession) {
    return (
      <Screen>
        <Panel>
          <Title>art admin</Title>
          <BodyText>checking moderator session...</BodyText>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen>
      <Panel>
        <TopBar>
          <div>
            <Title>art admin</Title>
            <BodyText>
              review paint submissions and publish commissions directly onto the
              desktop.
            </BodyText>
          </div>
          <TopBarActions>
            {session && <SessionBadge>@{session.login}</SessionBadge>}
            <TopButton type="button" onClick={onLogout}>
              log out
            </TopButton>
          </TopBarActions>
        </TopBar>
        {(authError || error) && <ErrorText>{authError || error}</ErrorText>}

        <Section>
          <SectionHeader>
            <SectionTitle>paint submissions</SectionTitle>
            <SectionText>
              approve drawings to publish them into the My Pictures folder.
            </SectionText>
          </SectionHeader>
          <Grid>
            {submissions.map(submission => (
              <Card key={submission.id}>
                <PreviewWrap>
                  <Preview src={submission.previewUrl} alt={submission.title} />
                </PreviewWrap>
                <CardContent>
                  <CardTitle>{submission.title}</CardTitle>
                  <Meta>
                    <span>Status: {submission.status}</span>
                    <span>Submitted: {formatDate(submission.createdAt)}</span>
                    {submission.reviewedAt && (
                      <span>Reviewed: {formatDate(submission.reviewedAt)}</span>
                    )}
                  </Meta>
                  {submission.status === 'pending' ? (
                    <>
                      <ReasonInput
                        type="text"
                        value={reasonById[submission.id] || ''}
                        placeholder="optional rejection note"
                        onChange={event =>
                          setReasonById(current => ({
                            ...current,
                            [submission.id]: event.target.value,
                          }))
                        }
                      />
                      <CardActions>
                        <ActionButton
                          type="button"
                          disabled={actionId === submission.id}
                          onClick={() =>
                            reviewSubmission(submission.id, 'approved')
                          }
                        >
                          approve
                        </ActionButton>
                        <RejectButton
                          type="button"
                          disabled={actionId === submission.id}
                          onClick={() =>
                            reviewSubmission(submission.id, 'rejected')
                          }
                        >
                          reject
                        </RejectButton>
                      </CardActions>
                    </>
                  ) : (
                    <Resolution>
                      {submission.status === 'approved'
                        ? 'published to my pictures.'
                        : submission.rejectionReason || 'rejected.'}
                    </Resolution>
                  )}
                </CardContent>
              </Card>
            ))}
            {submissions.length === 0 && (
              <EmptyState>No drawing submissions yet.</EmptyState>
            )}
          </Grid>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>commissions</SectionTitle>
            <SectionText>
              upload a piece, set its desktop slot, and it will replace the old
              commission placeholders immediately.
            </SectionText>
          </SectionHeader>
          <CommissionLayout>
            <CommissionForm>
              <FormGrid>
                <label>
                  <span>artist name</span>
                  <input
                    type="text"
                    value={commissionForm.artistName}
                    onChange={event =>
                      setCommissionForm(current => ({
                        ...current,
                        artistName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>artist link</span>
                  <input
                    type="text"
                    value={commissionForm.artistLink}
                    onChange={event =>
                      setCommissionForm(current => ({
                        ...current,
                        artistLink: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
                <label>
                  <span>date</span>
                  <input
                    type="text"
                    value={commissionForm.date}
                    onChange={event =>
                      setCommissionForm(current => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    placeholder="2026-03-19"
                  />
                </label>
                <PositionFields>
                  <label>
                    <span>row</span>
                    <input
                      type="number"
                      min="1"
                      value={commissionForm.row}
                      onChange={event =>
                        setCommissionForm(current => ({
                          ...current,
                          row: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>column</span>
                    <input
                      type="number"
                      min="1"
                      value={commissionForm.column}
                      onChange={event =>
                        setCommissionForm(current => ({
                          ...current,
                          column: event.target.value,
                        }))
                      }
                    />
                  </label>
                </PositionFields>
                <label className="form__wide">
                  <span>description</span>
                  <textarea
                    rows="4"
                    value={commissionForm.description}
                    onChange={event =>
                      setCommissionForm(current => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="optional small description"
                  />
                </label>
                <label className="form__wide">
                  <span>image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onCommissionFileChange}
                  />
                  <FieldHint>
                    {commissionForm.imageName
                      ? `selected: ${commissionForm.imageName}`
                      : commissionForm.id
                      ? 'leave empty to keep the current image'
                      : 'png or jpg'}
                  </FieldHint>
                </label>
              </FormGrid>
              <SlotHint>
                {slotMeta.gridIndex === null
                  ? slotMeta.message
                  : `slot ${slotMeta.gridIndex} - ${slotMeta.message}`}
              </SlotHint>
              {commissionForm.imagePreviewUrl && (
                <CommissionPreview
                  src={commissionForm.imagePreviewUrl}
                  alt="commission preview"
                />
              )}
              <CardActions>
                <ActionButton
                  type="button"
                  disabled={actionId === 'commission-save'}
                  onClick={saveCommission}
                >
                  {commissionForm.id ? 'save changes' : 'publish commission'}
                </ActionButton>
                <NeutralButton type="button" onClick={resetCommissionForm}>
                  clear
                </NeutralButton>
              </CardActions>
            </CommissionForm>
            <CommissionList>
              {commissions.map(commission => (
                <CommissionCard key={commission.id}>
                  <CommissionThumb
                    src={commission.imageUrl}
                    alt={commission.artistName}
                  />
                  <CommissionInfo>
                    <CardTitle>{commission.artistName}</CardTitle>
                    <Meta>
                      <span>{commission.date}</span>
                      <span>
                        row {(commission.gridIndex % ROWS_PER_COLUMN) + 1},{' '}
                        column{' '}
                        {Math.floor(commission.gridIndex / ROWS_PER_COLUMN) + 1}
                      </span>
                    </Meta>
                    {commission.description && (
                      <Resolution>{commission.description}</Resolution>
                    )}
                    <CardActions>
                      <NeutralButton
                        type="button"
                        onClick={() => editCommission(commission)}
                      >
                        edit
                      </NeutralButton>
                      <RejectButton
                        type="button"
                        disabled={
                          actionId === `commission-delete-${commission.id}`
                        }
                        onClick={() => removeCommission(commission.id)}
                      >
                        delete
                      </RejectButton>
                    </CardActions>
                  </CommissionInfo>
                </CommissionCard>
              ))}
              {commissions.length === 0 && (
                <EmptyState>No commissions published yet.</EmptyState>
              )}
            </CommissionList>
          </CommissionLayout>
        </Section>
      </Panel>
    </Screen>
  );
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

const Screen = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at top left, #d7e6ff 0%, transparent 28%),
    linear-gradient(180deg, #f3f6fb 0%, #dbe6f3 100%);
  color: #10233f;
  font-family: 'Tahoma', 'Noto Sans', sans-serif;
`;

const Panel = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #7f9db9;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 40px rgba(21, 48, 87, 0.18);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
`;

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TopButton = styled.button`
  height: 30px;
  padding: 0 12px;
  border: 1px solid #6b7fa5;
  background: linear-gradient(180deg, #ffffff 0%, #dfe8f7 100%);
  cursor: pointer;
  text-transform: lowercase;
`;

const SessionBadge = styled.div`
  padding: 6px 10px;
  border: 1px solid #9bb0d0;
  background: #eff5ff;
  font-size: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  text-transform: lowercase;
`;

const BodyText = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: #39506f;
`;

const ErrorText = styled.div`
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid #a12c2c;
  background: #ffe7e7;
  color: #7d1111;
`;

const Section = styled.section`
  margin-top: 26px;
`;

const SectionHeader = styled.div`
  margin-bottom: 14px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 18px;
  text-transform: lowercase;
`;

const SectionText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #4f6481;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #9ab0cb;
  background: #fdfefe;
`;

const PreviewWrap = styled.div`
  aspect-ratio: 4 / 3;
  background: linear-gradient(45deg, #f6f9ff 25%, transparent 25%),
    linear-gradient(-45deg, #f6f9ff 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f6f9ff 75%),
    linear-gradient(-45deg, transparent 75%, #f6f9ff 75%);
  background-size: 18px 18px;
  background-position: 0 0, 0 9px, 9px -9px, -9px 0;
  border-bottom: 1px solid #d0dced;
`;

const Preview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
`;

const CardContent = styled.div`
  padding: 12px;
`;

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Meta = styled.div`
  display: grid;
  gap: 4px;
  font-size: 12px;
  color: #526983;
  margin-bottom: 10px;
`;

const ReasonInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #9ab0cb;
  margin-bottom: 10px;
  font-size: 12px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  min-width: 110px;
  height: 32px;
  border: 1px solid #5d7a38;
  background: linear-gradient(180deg, #faffea 0%, #d6ef9a 100%);
  cursor: pointer;
  text-transform: lowercase;
`;

const NeutralButton = styled(ActionButton)`
  border-color: #6b7fa5;
  background: linear-gradient(180deg, #ffffff 0%, #dfe8f7 100%);
`;

const RejectButton = styled(ActionButton)`
  border-color: #8b3f3f;
  background: linear-gradient(180deg, #fff4f4 0%, #f1b1b1 100%);
`;

const Resolution = styled.div`
  font-size: 12px;
  color: #35506d;
  line-height: 1.45;
  white-space: pre-wrap;
`;

const EmptyState = styled.div`
  padding: 24px;
  border: 1px dashed #94a8c8;
  text-align: center;
  color: #4e6580;
  background: rgba(255, 255, 255, 0.7);
`;

const CommissionLayout = styled.div`
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
`;

const CommissionForm = styled.div`
  padding: 14px;
  border: 1px solid #9ab0cb;
  background: #fdfefe;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 10px;

  label {
    display: grid;
    gap: 5px;
    font-size: 12px;
    color: #35506d;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid #9ab0cb;
    font: inherit;
    background: #fff;
  }

  .form__wide {
    grid-column: 1 / -1;
  }
`;

const PositionFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const FieldHint = styled.div`
  font-size: 11px;
  color: #6a7f98;
`;

const SlotHint = styled.div`
  margin: 10px 0 12px;
  font-size: 12px;
  color: #29486f;
`;

const CommissionPreview = styled.img`
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border: 1px solid #9ab0cb;
  background: #fff;
  margin-bottom: 12px;
`;

const CommissionList = styled.div`
  display: grid;
  gap: 14px;
`;

const CommissionCard = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
  border: 1px solid #9ab0cb;
  background: #fdfefe;
`;

const CommissionThumb = styled.img`
  width: 100%;
  height: 140px;
  object-fit: contain;
  border: 1px solid #c6d5e8;
  background: #fff;
`;

const CommissionInfo = styled.div`
  min-width: 0;
`;

export default DrawingsAdminPage;
