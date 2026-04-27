import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Check, Copy } from 'lucide-react';

interface ContentRendererProps {
  content: any;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string) => void;
}

export function VideoContentRenderer({ content, copiedField, onCopy }: ContentRendererProps) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Title */}
      {content.title && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>Video Title</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.title, 'title')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'title' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div style={{ background: 'var(--muted)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {content.title}
          </div>
        </div>
      )}

      {/* Hook */}
      {content.hook && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>Hook (First 5 seconds)</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.hook, 'hook')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'hook' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.hook}
            readOnly
            rows={3}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          />
        </div>
      )}

      {/* Script */}
      {content.script && Array.isArray(content.script) && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block', fontWeight: 'var(--font-weight-semibold)' }}>Video Script</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-3)', maxWidth: '100%', overflow: 'hidden' }}>
            {content.script.map((scene: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--muted)', 
                  padding: 'var(--spacing-3)', 
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                {scene.timestamp && (
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: 'var(--primary)', wordBreak: 'break-word' }}>
                    {scene.timestamp}
                  </p>
                )}
                {scene.narration && (
                  <div style={{ marginBottom: 'var(--spacing-2)', maxWidth: '100%', overflow: 'hidden' }}>
                    <p className="text-sm opacity-80" style={{ marginBottom: 'var(--spacing-1)' }}>Narration:</p>
                    <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{scene.narration}</p>
                  </div>
                )}
                {scene.visual && (
                  <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    <p className="text-sm opacity-80" style={{ marginBottom: 'var(--spacing-1)' }}>Visual:</p>
                    <p className="text-sm" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{scene.visual}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B-Roll Ideas */}
      {content.bRollIdeas && Array.isArray(content.bRollIdeas) && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>B-Roll Ideas</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)', maxWidth: '100%', overflow: 'hidden' }}>
            {content.bRollIdeas.map((idea: string, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--muted)', 
                  padding: 'var(--spacing-3)', 
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>• {idea}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Music Mood */}
      {content.musicMood && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Music Mood</Label>
          <div style={{ background: 'var(--accent)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {content.musicMood}
          </div>
        </div>
      )}

      {/* End Screen CTA */}
      {content.endScreenCta && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>End Screen CTA</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.endScreenCta, 'endScreenCta')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'endScreenCta' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div style={{ background: 'var(--primary)', color: 'white', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)', textAlign: 'center', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {content.endScreenCta}
          </div>
        </div>
      )}

      {/* YouTube Description */}
      {content.youtubeDescription && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>YouTube Description</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.youtubeDescription, 'youtubeDescription')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'youtubeDescription' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.youtubeDescription}
            readOnly
            rows={6}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          />
        </div>
      )}

      {/* Thumbnail Ideas */}
      {content.thumbnailIdeas && Array.isArray(content.thumbnailIdeas) && (
        <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Thumbnail Ideas</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)', maxWidth: '100%', overflow: 'hidden' }}>
            {content.thumbnailIdeas.map((idea: string, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--muted)', 
                  padding: 'var(--spacing-3)', 
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>Thumbnail {idx + 1}</p>
                <p style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{idea}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SocialContentRenderer({ content, copiedField, onCopy }: ContentRendererProps) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
      {/* LinkedIn */}
      {content.linkedin && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <span style={{ color: '#0077b5', fontWeight: 'var(--font-weight-semibold)' }}>● LinkedIn</span>
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.linkedin.post, 'linkedin')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'linkedin' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.linkedin.post}
            readOnly
            rows={6}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-2)',
            }}
          />
          {content.linkedin.hashtags && (
            <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
              {content.linkedin.hashtags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline" style={{ background: 'var(--accent)', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-md)' }}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {content.linkedin.bestTime && (
            <p className="text-xs opacity-60">Best time: {content.linkedin.bestTime}</p>
          )}
        </div>
      )}

      {/* Twitter */}
      {content.twitter && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <span style={{ color: '#1DA1F2', fontWeight: 'var(--font-weight-semibold)' }}>● Twitter / X</span>
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.twitter.thread.join('\n\n'), 'twitter')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'twitter' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
            {content.twitter.thread.map((tweet: string, idx: number) => (
              <div key={idx} style={{ background: 'var(--muted)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                <p className="text-xs opacity-60" style={{ marginBottom: 'var(--spacing-1)' }}>Tweet {idx + 1}</p>
                <p>{tweet}</p>
              </div>
            ))}
          </div>
          {content.twitter.hashtags && (
            <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              {content.twitter.hashtags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline" style={{ background: 'var(--accent)', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-md)' }}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {content.twitter.bestTime && (
            <p className="text-xs opacity-60" style={{ marginTop: 'var(--spacing-1)' }}>Best time: {content.twitter.bestTime}</p>
          )}
        </div>
      )}

      {/* Instagram */}
      {content.instagram && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <span style={{ color: '#E1306C', fontWeight: 'var(--font-weight-semibold)' }}>● Instagram</span>
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.instagram.caption, 'instagram')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'instagram' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.instagram.caption}
            readOnly
            rows={6}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-2)',
            }}
          />
          {content.instagram.hashtags && (
            <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
              {content.instagram.hashtags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline" style={{ background: 'var(--accent)', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-md)' }}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {content.instagram.bestTime && (
            <p className="text-xs opacity-60">Best time: {content.instagram.bestTime}</p>
          )}
        </div>
      )}

      {/* Facebook */}
      {content.facebook && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <span style={{ color: '#1877F2', fontWeight: 'var(--font-weight-semibold)' }}>● Facebook</span>
            </Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.facebook.post, 'facebook')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'facebook' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.facebook.post}
            readOnly
            rows={6}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-2)',
            }}
          />
          {content.facebook.bestTime && (
            <p className="text-xs opacity-60">Best time: {content.facebook.bestTime}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdContentRenderer({ content, copiedField, onCopy }: ContentRendererProps) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
      {/* Headlines */}
      {content.headlines && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Headlines</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
            {content.headlines.map((headline: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between" style={{ background: 'var(--muted)', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                <span>{headline}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(headline, `headline-${idx}`)}
                  style={{ padding: 'var(--spacing-1)' }}
                >
                  {copiedField === `headline-${idx}` ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descriptions */}
      {content.descriptions && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Descriptions</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
            {content.descriptions.map((desc: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between" style={{ background: 'var(--muted)', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                <span>{desc}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(desc, `description-${idx}`)}
                  style={{ padding: 'var(--spacing-1)' }}
                >
                  {copiedField === `description-${idx}` ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Long Description */}
      {content.longDescription && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>Long Description</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.longDescription, 'longDescription')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'longDescription' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.longDescription}
            readOnly
            rows={4}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
            }}
          />
        </div>
      )}

      {/* CTA Options */}
      {content.ctaOptions && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>CTA Options</Label>
          <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
            {content.ctaOptions.map((cta: string, idx: number) => (
              <Badge
                key={idx}
                variant="outline"
                style={{
                  background: 'var(--accent)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {cta}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Targeting Keywords */}
      {content.targetingKeywords && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Targeting Keywords</Label>
          <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
            {content.targetingKeywords.map((keyword: string, idx: number) => (
              <Badge
                key={idx}
                variant="outline"
                style={{
                  background: 'var(--accent)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Ad Extensions */}
      {content.adExtensions && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block', fontWeight: 'var(--font-weight-semibold)' }}>Ad Extensions</Label>
          
          {/* Sitelinks */}
          {content.adExtensions.sitelinks && (
            <div style={{ marginBottom: 'var(--spacing-3)' }}>
              <p className="text-sm opacity-80" style={{ marginBottom: 'var(--spacing-1)' }}>Sitelinks</p>
              <div className="flex flex-col" style={{ gap: 'var(--spacing-1)' }}>
                {content.adExtensions.sitelinks.map((link: string, idx: number) => (
                  <div key={idx} style={{ background: 'var(--muted)', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)' }}>
                    <p className="text-sm">{link}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Callouts */}
          {content.adExtensions.callouts && (
            <div style={{ marginBottom: 'var(--spacing-3)' }}>
              <p className="text-sm opacity-80" style={{ marginBottom: 'var(--spacing-1)' }}>Callouts</p>
              <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
                {content.adExtensions.callouts.map((callout: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    style={{
                      background: 'var(--accent)',
                      padding: 'var(--spacing-1) var(--spacing-2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {callout}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Snippets */}
          {content.adExtensions.snippets && (
            <div>
              <p className="text-sm opacity-80" style={{ marginBottom: 'var(--spacing-1)' }}>Structured Snippets</p>
              <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
                {content.adExtensions.snippets.map((snippet: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    style={{
                      background: 'var(--accent)',
                      padding: 'var(--spacing-1) var(--spacing-2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {snippet}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* A/B Test Variants */}
      {content.variants && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block', fontWeight: 'var(--font-weight-semibold)' }}>A/B Test Variants</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
            {content.variants.map((variant: any, idx: number) => (
              <div key={idx} style={{ background: 'var(--muted)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Variant {idx + 1}</p>
                <div className="flex flex-col" style={{ gap: 'var(--spacing-1)' }}>
                  <p className="text-sm"><span className="opacity-60">Headline:</span> {variant.headline}</p>
                  <p className="text-sm"><span className="opacity-60">Description:</span> {variant.description}</p>
                  <p className="text-sm"><span className="opacity-60">CTA:</span> {variant.cta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EmailContentRenderer({ content, copiedField, onCopy }: ContentRendererProps) {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
      {/* Subject Line */}
      {content.subjectLine && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>Subject Line</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.subjectLine, 'subjectLine')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'subjectLine' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div style={{ background: 'var(--muted)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
            {content.subjectLine}
          </div>
        </div>
      )}

      {/* Preview Text */}
      {content.previewText && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Preview Text</Label>
          <div style={{ background: 'var(--muted)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
            {content.previewText}
          </div>
        </div>
      )}

      {/* Body */}
      {content.body && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
            <Label>Email Body</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(content.body, 'body')}
              style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
            >
              {copiedField === 'body' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Textarea
            value={content.body}
            readOnly
            rows={10}
            className="w-full resize-none"
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          />
        </div>
      )}

      {/* CTA Button Text */}
      {content.ctaButtonText && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>CTA Button Text</Label>
          <div style={{ background: 'var(--primary)', color: 'white', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)', textAlign: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
            {content.ctaButtonText}
          </div>
        </div>
      )}

      {/* Alternative Subject Lines */}
      {content.alternativeSubjects && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Alternative Subject Lines (A/B Testing)</Label>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
            {content.alternativeSubjects.map((subject: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between" style={{ background: 'var(--muted)', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                <span>{subject}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(subject, `alt-subject-${idx}`)}
                  style={{ padding: 'var(--spacing-1)' }}
                >
                  {copiedField === `alt-subject-${idx}` ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Send Time */}
      {content.bestSendTime && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Best Send Time</Label>
          <div style={{ background: 'var(--accent)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
            {content.bestSendTime}
          </div>
        </div>
      )}

      {/* Personalization Tags */}
      {content.personalizationTags && (
        <div>
          <Label style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>Personalization Tags</Label>
          <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
            {content.personalizationTags.map((tag: string, idx: number) => (
              <Badge
                key={idx}
                variant="outline"
                style={{
                  background: 'var(--accent)',
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  fontFamily: 'monospace',
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketAnalysisRenderer({ content, copiedField, onCopy }: ContentRendererProps) {
  // Market analysis is stored in competitorAnalyses, render like competitor analysis
  return (
    <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
      {Object.entries(content)
        .filter(([key]) => !['id', 'timestamp', 'businessId', 'analysisType'].includes(key))
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return (
              <div key={key}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCopy(value, key)}
                    style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
                  >
                    {copiedField === key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Textarea
                  value={value}
                  readOnly
                  rows={value.length > 200 ? 10 : value.length > 100 ? 6 : 3}
                  className="w-full resize-none"
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                />
              </div>
            );
          } else if (Array.isArray(value)) {
            return (
              <div key={key}>
                <Label className="capitalize" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                {value.every(item => typeof item === 'string') ? (
                  <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)', maxWidth: '100%' }}>
                    {value.map((item, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        style={{
                          background: 'var(--accent)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-lg)',
                          maxWidth: '100%',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col" style={{ gap: 'var(--spacing-2)', maxWidth: '100%' }}>
                    {value.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--muted)', 
                          padding: 'var(--spacing-3)', 
                          borderRadius: 'var(--radius-lg)',
                          maxWidth: '100%',
                          overflow: 'hidden',
                        }}
                      >
                        <pre 
                          className="text-sm whitespace-pre-wrap break-words" 
                          style={{ 
                            maxWidth: '100%',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          } else if (typeof value === 'object' && value !== null) {
            return (
              <div key={key}>
                <Label className="capitalize" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div 
                  style={{ 
                    background: 'var(--muted)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: 'var(--spacing-3)',
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <pre 
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ 
                      maxWidth: '100%',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              </div>
            );
          }
          return null;
        })}
    </div>
  );
}