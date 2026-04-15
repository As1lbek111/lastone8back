import { useEffect, useState } from 'react';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, DoorOpen, Users, Clock, AlertTriangle } from 'lucide-react';

const WEEKDAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const DAYS_UZ = { MONDAY:'Du', TUESDAY:'Se', WEDNESDAY:'Chor', THURSDAY:'Pay', FRIDAY:'Ju', SATURDAY:'Sha', SUNDAY:'Ya' };

const EMPTY = { name: '', capacity: 20 };

export default function AdminRooms() {
  const { t } = useLang();
  const [rooms, setRooms] = useState([]);
  const [roomGroups, setRoomGroups] = useState({}); // roomId -> groups using it
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);
  const [expandedRoom, setExpandedRoom] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [roomsRes, groupsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/groups/my'),
      ]);
      const rms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const grps = Array.isArray(groupsRes.data) ? groupsRes.data : [];

      // Map room_id -> groups
      const map = {};
      rms.forEach(r => { map[r.id] = []; });
      grps.forEach(g => {
        if (g.room_id && map[g.room_id]) map[g.room_id].push(g);
      });
      setRooms(rms);
      setRoomGroups(map);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Check conflicts within same room
  const getConflicts = (roomId) => {
    const groups = roomGroups[roomId] || [];
    const conflicts = [];
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i], b = groups[j];
        if (!a.start_time || !b.start_time || !a.week_days?.length || !b.week_days?.length) continue;
        if (a.start_time === b.start_time) {
          const sharedDays = (a.week_days || []).filter(d => (b.week_days || []).includes(d));
          if (sharedDays.length > 0) {
            conflicts.push({ a, b, days: sharedDays });
          }
        }
      }
    }
    return conflicts;
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/rooms/${editing.id}`, form);
      else await api.post('/rooms', form);
      setModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/rooms/${delId}`); setDelId(null); load(); } catch { alert('Error'); }
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <div>
          <div className="page-title">{t('rooms')}</div>
          <div className="page-subtitle">{rooms.length} ta xona</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }}>
          <Plus size={15} /> {t('addRoom')}
        </button>
      </div>

      {/* Rooms grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card card-p" style={{ height: 120, opacity: 0.4 }} />
          ))
        ) : rooms.length === 0 ? (
          <div className="card card-p" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state" style={{ padding: 48 }}>
              <DoorOpen size={40} style={{ opacity: 0.2 }} />
              <div>Xonalar yo'q</div>
            </div>
          </div>
        ) : rooms.map(r => {
          const groups = roomGroups[r.id] || [];
          const conflicts = getConflicts(r.id);
          const hasConflict = conflicts.length > 0;
          return (
            <div key={r.id} className="card" style={{ borderColor: hasConflict ? 'var(--red)' : 'var(--border)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: hasConflict ? 'var(--red-light)' : 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: hasConflict ? 'var(--red)' : 'var(--primary)',
                }}>
                  {hasConflict ? <AlertTriangle size={20} /> : <DoorOpen size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Users size={11} /> {r.capacity} kishi sig'imi
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(r); setForm({ name: r.name, capacity: r.capacity }); setModal(true); }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDelId(r.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Conflict warning */}
              {hasConflict && (
                <div style={{ padding: '10px 16px', background: 'var(--red-light)', borderBottom: '1px solid #fecaca' }}>
                  {conflicts.map((c, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 2 }}>
                      ⚠️ "{c.a.name}" va "{c.b.name}" — {c.a.start_time} · {c.days.map(d => DAYS_UZ[d]).join(', ')}
                    </div>
                  ))}
                </div>
              )}

              {/* Groups using this room */}
              <div style={{ padding: '12px 16px' }}>
                {groups.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>
                    Hech qanday guruh yo'q
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Guruhlar ({groups.length})
                    </div>
                    {groups.slice(0, expandedRoom === r.id ? 999 : 3).map(g => (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                            {g.start_time && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Clock size={10} /> {g.start_time}
                              </span>
                            )}
                            {(g.week_days || []).map(d => (
                              <span key={d} style={{
                                padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                background: 'var(--primary-light)', color: 'var(--primary)',
                              }}>{DAYS_UZ[d]}</span>
                            ))}
                          </div>
                        </div>
                        <span className={`badge ${g.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                          {g.is_active ? 'Faol' : 'Nofaol'}
                        </span>
                      </div>
                    ))}
                    {groups.length > 3 && (
                      <button onClick={() => setExpandedRoom(expandedRoom === r.id ? null : r.id)}
                        style={{ marginTop: 8, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        {expandedRoom === r.id ? 'Kamroq ko\'rsatish' : `+ ${groups.length - 3} ta ko'proq`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? "Xonani tahrirlash" : "Yangi xona"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t('loading') : t('save')}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Xona nomi</label>
          <input className="form-input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Masalan: Xona 101" />
        </div>
        <div className="form-group">
          <label className="form-label">Sig'im (kishi)</label>
          <input type="number" className="form-input" value={form.capacity || 20} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="O'chirishni tasdiqlang"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDelId(null)}>{t('cancel')}</button>
            <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
          </>
        }>
        <p style={{ color: 'var(--text2)' }}>{t('confirmDelete')}</p>
      </Modal>
    </div>
  );
}
