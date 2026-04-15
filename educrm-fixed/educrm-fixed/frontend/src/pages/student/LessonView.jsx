import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import api from '../../utils/api';
import { ArrowLeft, Upload, Send, CheckCircle, Clock, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function StudentLessonView() {
  const { groupId, lessonId } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/lessons/${lessonId}`).then(r => setLesson(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [lessonId]);

  const submitHomework = async () => {
    if (!lesson?.homework_id) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('comment', comment);
      await api.post(`/homework/${lesson.homework_id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitSuccess(true);
      setFiles([]);
      setComment('');
      load();
    } catch (err) { alert(err.response?.data?.error || 'Xatolik'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /> {t('loading')}</div>;
  if (!lesson) return <div className="empty-state card card-p"><div>Dars topilmadi</div></div>;

  const statusBadge = {
    waiting: <span className="badge badge-orange">Ko'rib chiqilmoqda</span>,
    accepted: <span className="badge badge-green">Qabul qilindi ✓</span>,
    returned: <span className="badge badge-blue">Qaytarildi</span>,
    failed: <span className="badge badge-red">Muvaffaqiyatsiz</span>,
  };

  return (
    <div>
      <div className="flex-row mb-24" style={{ gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/student/groups/${groupId}`)} style={{ padding: '6px 10px' }}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <div className="page-title">{lesson.title}</div>
          <div className="page-subtitle">
            {lesson.lesson_date ? new Date(lesson.lesson_date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: lesson.video_url ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Left: video + description */}
        <div>
          {lesson.video_url && (
            <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <video
                controls
                style={{ width: '100%', maxHeight: 420, background: '#000', display: 'block' }}
                src={`${API_BASE}${lesson.video_url}`}
                onTimeUpdate={e => {
                  const pct = (e.target.currentTime / e.target.duration) * 100;
                  if (pct > 10) {
                    api.post(`/lessons/${lessonId}/progress`, {
                      watched_seconds: Math.floor(e.target.currentTime),
                      completed: pct >= 90,
                    }).catch(() => {});
                  }
                }}
              />
              <div style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--muted)' }}>
                {lesson.video_filename} · {lesson.video_size_mb} MB
              </div>
            </div>
          )}

          {lesson.description && (
            <div className="card card-p" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Dars haqida</div>
              <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 }}>{lesson.description}</div>
            </div>
          )}
        </div>

        {/* Right: homework panel */}
        <div>
          {lesson.homework_id ? (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📝 {lesson.hw_title}</div>
                {lesson.hw_desc && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{lesson.hw_desc}</div>}
                {lesson.hw_due_date && (
                  <div style={{ fontSize: 12, marginTop: 6, color: 'var(--red)' }}>
                    ⏰ Muddat: {new Date(lesson.hw_due_date).toLocaleDateString('uz-UZ')}
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* Already submitted */}
                {lesson.submission_id ? (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      {statusBadge[lesson.grade != null ? (lesson.grade >= 60 ? 'accepted' : 'returned') : 'waiting']}
                    </div>
                    {lesson.grade != null && (
                      <div style={{ padding: '12px 16px', background: lesson.grade >= 60 ? 'var(--green-light)' : 'var(--red-light)', borderRadius: 8, marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 20, color: lesson.grade >= 60 ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {lesson.grade}/100
                        </div>
                        {lesson.teacher_feedback && <div style={{ fontSize: 12.5, marginTop: 6, color: 'var(--text2)' }}>{lesson.teacher_feedback}</div>}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Topshirilgan: {lesson.submitted_at ? new Date(lesson.submitted_at).toLocaleDateString('uz-UZ') : '—'}
                    </div>
                    {lesson.file_names?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {lesson.file_names.map((name, i) => (
                          <div key={i} style={{ fontSize: 12.5, padding: '4px 0' }}>📎 {name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Submit form */
                  <div>
                    {submitSuccess && (
                      <div style={{ padding: '10px 14px', background: 'var(--green-light)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} /> Muvaffaqiyatli topshirildi!
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Fayllar (max 5)</label>
                      <input type="file" multiple accept="*/*" max={5}
                        style={{ width: '100%', fontSize: 13, padding: '6px 0' }}
                        onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} />
                      {files.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                          {files.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Izoh</label>
                      <textarea className="form-textarea" value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Qo'shimcha izoh..." style={{ minHeight: 70 }} />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }}
                      onClick={submitHomework} disabled={submitting || files.length === 0}>
                      <Send size={14} /> {submitting ? t('loading') : t('submitHomework')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card card-p" style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13 }}>Bu dars uchun uy vazifasi yo'q</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
