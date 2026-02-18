'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Candidate } from '@/lib/types';
import { Upload, X, FileText, User, Briefcase, MapPin, Mail, Phone, Calendar, Sparkles, Heart, ArrowLeft, Save, Loader2, Video } from 'lucide-react';

interface CandidateFormProps {
    initialData?: Partial<Candidate>;
    mode: 'create' | 'edit';
}

export function CandidateForm({ initialData, mode }: CandidateFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Candidate>>(initialData || {
        name: '',
        email: '',
        phone: '',
        title: '',
        experience: 0,
        skills: [],
        bio: '',
        location: '',
        availability: 'immediate',
        joiningDate: '',
        resumeUrl: '',
        hiringCompanyLogo: '',
        hobbies: [],
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumePreview, setResumePreview] = useState<string>(initialData?.resumeUrl || '');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(initialData?.hiringCompanyLogo || '');
    const [skillsInput, setSkillsInput] = useState<string>(
        Array.isArray(initialData?.skills) ? initialData.skills.join(', ') : ''
    );
    const [hobbiesInput, setHobbiesInput] = useState<string>(
        Array.isArray(initialData?.hobbies) ? initialData.hobbies.join(', ') : ''
    );
    const [recordingFile, setRecordingFile] = useState<File | null>(null);
    const [recordingPreview, setRecordingPreview] = useState<string>(initialData?.recordingUrl || '');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const startUrl = URL.createObjectURL(file);
            setImagePreview(startUrl);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const startUrl = URL.createObjectURL(file);
            setLogoPreview(startUrl);
        }
    };

    const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResumeFile(file);
            setResumePreview(file.name);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData({ ...formData, imageUrl: undefined });
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
        setFormData({ ...formData, hiringCompanyLogo: undefined });
    };

    const removeResume = () => {
        setResumeFile(null);
        setResumePreview('');
        setFormData({ ...formData, resumeUrl: undefined });
    };

    const handleRecordingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRecordingFile(file);
            setRecordingPreview(URL.createObjectURL(file));
        }
    };

    const removeRecording = () => {
        setRecordingFile(null);
        setRecordingPreview('');
        setFormData({ ...formData, recordingUrl: undefined });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.imageUrl;
            let resumeUrl = formData.resumeUrl;
            let hiringCompanyLogo = formData.hiringCompanyLogo;
            let recordingUrl = formData.recordingUrl;

            // 1. Upload Image if changed
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('file', imageFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });

                if (!uploadRes.ok) throw new Error('Image upload failed');

                const uploadJson = await uploadRes.json();
                imageUrl = uploadJson.url;
            }

            // 2. Upload Logo if changed
            if (logoFile) {
                const uploadData = new FormData();
                uploadData.append('file', logoFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });

                if (!uploadRes.ok) throw new Error('Logo upload failed');

                const uploadJson = await uploadRes.json();
                hiringCompanyLogo = uploadJson.url;
            }

            // 3. Upload Resume if changed
            if (resumeFile) {
                const uploadData = new FormData();
                uploadData.append('file', resumeFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });

                if (!uploadRes.ok) throw new Error('Resume upload failed');

                const uploadJson = await uploadRes.json();
                resumeUrl = uploadJson.url;
            }

            // 4. Upload Recording if changed
            if (recordingFile) {
                const uploadData = new FormData();
                uploadData.append('file', recordingFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });

                if (!uploadRes.ok) throw new Error('Recording upload failed');

                const uploadJson = await uploadRes.json();
                recordingUrl = uploadJson.url;
            }

            // 5. Save Candidate Data
            const candidateData = {
                ...formData,
                imageUrl,
                resumeUrl,
                hiringCompanyLogo,
                recordingUrl,
                skills: skillsInput
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
                hobbies: hobbiesInput
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
            };

            const res = await fetch('/api/candidates', {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateData),
            });

            if (!res.ok) throw new Error('Failed to save candidate');

            // Log the action
            const sessionRes = await fetch('/api/auth/session');
            const session = await sessionRes.json();
            const user = session?.user;

            if (user) {
                await fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        action: mode === 'create' ? 'create_candidate' : 'update_candidate',
                        resourceType: 'candidate',
                        resourceId: candidateData.id,
                        details: { name: candidateData.name }
                    }),
                });
            }

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error saving candidate');
        } finally {
            setLoading(false);
        }
    };

    // Section wrapper component for consistent styling
    const FormSection = ({ icon: Icon, title, description, children }: {
        icon: React.ElementType;
        title: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-5 transition-all duration-200 hover:border-border/70">
            <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-8">

            {/* ──── Section 1: Profile Photo & Resume ──── */}
            <FormSection icon={User} title="Profile & Documents" description="Upload a profile photo and resume">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image Upload */}
                    <div className="space-y-3">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Profile Photo</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-secondary border-2 border-border/50 shadow-inner flex-shrink-0">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                                        <User className="w-8 h-8 opacity-40" />
                                        <span className="text-[10px] opacity-60">No Photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-primary/20">
                                    <Upload className="w-4 h-4" />
                                    Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                                {imagePreview && (
                                    <button type="button" onClick={removeImage} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                        <X className="w-3 h-3" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-3">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Resume</Label>
                        <div className={`p-5 border-2 border-dashed rounded-xl transition-all duration-200 ${resumePreview ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-secondary/20 hover:bg-secondary/30 hover:border-border/70'}`}>
                            {resumePreview ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <FileText className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate max-w-[160px]">
                                                {resumeFile ? resumeFile.name : 'Current Resume'}
                                            </p>
                                            <p className="text-xs text-green-400">✓ Ready to submit</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={removeResume} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center gap-2 text-center min-h-[90px]">
                                    <Upload className="w-7 h-7 text-muted-foreground/50" />
                                    <span className="text-sm text-muted-foreground">
                                        Drop or <span className="text-primary underline underline-offset-2">browse</span>
                                    </span>
                                    <span className="text-xs text-muted-foreground/60">PDF, DOC, DOCX</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleResumeChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </FormSection>

            {/* ──── Section: Recording ──── */}
            <FormSection icon={Video} title="Candidate Recording" description="Upload a video or audio introduction">
                <div className="space-y-3">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Video / Audio Recording</Label>
                    <div className={`p-5 border-2 border-dashed rounded-xl transition-all duration-200 ${recordingPreview ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-secondary/20 hover:bg-secondary/30 hover:border-border/70'}`}>
                        {recordingPreview ? (
                            <div className="space-y-3">
                                <video
                                    src={recordingPreview}
                                    controls
                                    className="w-full rounded-lg max-h-[240px] bg-black"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-green-400">
                                            {recordingFile ? recordingFile.name : 'Current Recording'}
                                        </span>
                                    </div>
                                    <button type="button" onClick={removeRecording} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
                                <Video className="w-8 h-8 text-muted-foreground/50" />
                                <span className="text-sm text-muted-foreground">
                                    Drop or <span className="text-primary underline underline-offset-2">browse</span>
                                </span>
                                <span className="text-xs text-muted-foreground/60">MP4, WebM, MOV (max 100MB)</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                                    onChange={handleRecordingChange}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground/60">Clients will see this recording on the candidate profile (only if uploaded).</p>
                </div>
            </FormSection>

            {/* ──── Section 2: Personal Information ──── */}
            <FormSection icon={Mail} title="Personal Information" description="Name, email, and contact details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            Full Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. John Smith"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            Professional Title <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={formData.title || ''}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Restoration Office Admin"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            Email <span className="text-xs text-muted-foreground">(Private)</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            Phone <span className="text-xs text-muted-foreground">(Private)</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        Location <span className="text-red-400">*</span>
                    </Label>
                    <select
                        id="location"
                        className="flex h-10 w-full rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-border"
                        value={formData.location || ''}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        required
                    >
                        <option value="" disabled>Select a location...</option>
                        <option value="Noida, India">Noida, India</option>
                        <option value="Dehradun, India">Dehradun, India</option>
                    </select>
                </div>
            </FormSection>

            {/* ──── Section 3: Availability & Experience ──── */}
            <FormSection icon={Calendar} title="Availability & Experience" description="Hiring status and years of experience">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="availability" className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            Availability <span className="text-red-400">*</span>
                        </Label>
                        <select
                            id="availability"
                            className="flex h-10 w-full rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-border"
                            value={formData.availability || 'immediate'}
                            onChange={e => setFormData({ ...formData, availability: e.target.value as any })}
                            required
                        >
                            <option value="immediate">✅ Immediate Hire</option>
                            <option value="two_weeks">⏳ 2 Weeks Notice (7-15 Days)</option>
                            <option value="specific_date">📅 Specific Date</option>
                            <option value="negotiable">🤝 Negotiable</option>
                            <option value="hired">🎉 Hired</option>
                        </select>
                    </div>

                    {formData.availability === 'specific_date' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Label htmlFor="joiningDate">Available From</Label>
                            <Input
                                id="joiningDate"
                                type="date"
                                value={formData.joiningDate || ''}
                                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="experience" className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            Experience (Years) <span className="text-red-400">*</span>
                        </Label>
                        <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.experience || 0}
                            onChange={e => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                            placeholder="e.g. 5"
                            required
                        />
                    </div>
                </div>

                {/* Hired company logo section */}
                {formData.availability === 'hired' && (
                    <div className="p-5 border-2 border-dashed border-accent/30 rounded-xl bg-accent/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-2 mb-4">
                            <Label className="text-accent font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Hiring Company Logo
                            </Label>
                            <p className="text-xs text-muted-foreground">This logo appears below the &quot;HIRED&quot; badge on their card.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white border border-border shadow-sm flex items-center justify-center">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-[10px] text-gray-400 text-center px-1">
                                        No Logo
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <label className="cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:shadow-md">
                                    <Upload className="w-4 h-4" />
                                    Upload Logo
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                </label>
                                {logoPreview && (
                                    <button type="button" onClick={removeLogo} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                        <X className="w-3 h-3" />
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </FormSection>

            {/* ──── Section 4: Professional Details ──── */}
            <FormSection icon={Sparkles} title="Professional Details" description="Bio, skills, and interests">
                <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-1.5">
                        Professional Bio <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                        id="bio"
                        value={formData.bio || ''}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        placeholder="Write a brief professional summary highlighting key achievements, specialties, and career goals..."
                        required
                    />
                    <p className="text-xs text-muted-foreground/60">This will be displayed on their candidate card and profile page.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="skills" className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                            Skills
                        </Label>
                        <Input
                            id="skills"
                            value={skillsInput}
                            onChange={e => setSkillsInput(e.target.value)}
                            placeholder="Water Damage, Mold Remediation, IICRC..."
                        />
                        <p className="text-xs text-muted-foreground/60">Separate with commas</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hobbies" className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                            Hobbies & Interests
                        </Label>
                        <Input
                            id="hobbies"
                            value={hobbiesInput}
                            onChange={e => setHobbiesInput(e.target.value)}
                            placeholder="Fishing, Coding, Hiking..."
                        />
                        <p className="text-xs text-muted-foreground/60">Separate with commas</p>
                    </div>
                </div>
            </FormSection>

            {/* ──── Action Buttons ──── */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 min-w-[160px] justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            {mode === 'create' ? 'Add Candidate' : 'Save Changes'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
