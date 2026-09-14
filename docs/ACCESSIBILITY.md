# Accessibility

Accessibility là yêu cầu nền tảng vì ứng dụng phục vụ người dùng ngoài thực địa, người trung niên/lớn tuổi và người dùng cần công nghệ hỗ trợ.

## Targets

- WCAG 2.2 AA as web target where applicable.
- Native semantics compatible with TalkBack/VoiceOver.
- Platform text scaling supported.
- Critical workflows remain usable at large text sizes.
- Color is never the sole information channel.

## Text scaling

Support:
- OS text scale / Dynamic Type.
- In-app presets: Default / Large / Very Large / Extra Large.
- Reflow instead of clipping critical data.
- Avoid fixed-height cards for variable text.

Test large-scale layouts for:
- Home status.
- Chart summary.
- Calendar day detail.
- Drainage recommendation.
- Settings.
- PDF large-print preview.

## Touch targets

Use platform-recommended minimum targets and adequate spacing between controls, especially for field use.

## Screen reader

Every meaningful control/value needs semantic labels.

Example chart accessibility:
- concise summary of trend,
- next high/low events,
- optional accessible data table,
- avoid requiring spatial chart interpretation.

## Color/contrast

- Semantic status always has icon + text.
- Light/dark/high-contrast modes.
- Validate chart line/background contrast.
- Avoid low-opacity text for important timestamps/source labels.

## Motion

Respect reduced-motion preference.
Avoid essential information conveyed only through animation.

## Numeric readability

- Clear unit placement.
- Tabular numbers where supported.
- Localized decimal/time formats.
- Do not use tiny superscript/footnote text for critical source or safety warnings.

## Outdoor usage

Provide or design for:
- high contrast,
- large primary numbers,
- simple status hierarchy,
- one-handed interaction,
- landscape/tablet adaptation.

## Testing checklist

- [ ] Android TalkBack smoke test.
- [ ] iOS VoiceOver smoke test.
- [ ] Keyboard navigation on web/admin.
- [ ] 200% browser zoom on web.
- [ ] Large text scale on mobile.
- [ ] Dark mode.
- [ ] High contrast.
- [ ] Reduced motion.
- [ ] Color-blind simulation for status/chart palette.
- [ ] PDF large-print output.

## Definition of Done

A feature is not complete if its primary workflow becomes unusable under supported text scaling or screen-reader navigation.
