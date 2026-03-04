import type { CommandExecutor } from '../types';

const norm = (value: any): string =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const studyNameOf = (study: any): string =>
    String(study?.name || study?.description || '').trim();

const MAX_NON_VOLUME_INDICATORS = 2;

const isVolumeStudy = (study: any): boolean => {
    const name = norm(studyNameOf(study));
    return name === 'volume' || name.startsWith('volume ');
};

const findStudyMatches = (studies: any[], targetName: string): any[] => {
    const target = norm(targetName);
    if (!target) return [];
    return studies.filter((study) => {
        const current = norm(studyNameOf(study));
        if (!current) return false;
        return current === target || current.includes(target) || target.includes(current);
    });
};

export const IndicatorHandler: CommandExecutor = {
    execute: async (chart: any, params: any) => {
        const action = params?.action_type || params?.action;
        if (!chart) throw new Error('No chart instance available');

        if (action === 'add_indicator') {
            const name = String(params?.name || '').trim();
            if (!name) throw new Error('add_indicator requires name');
            const inputs = params?.inputs || {};
            const studies = chart.getAllStudies?.() || [];
            const isRequestedVolume = isVolumeStudy({ name, description: name });

            if (isRequestedVolume) {
                const volumeMatches = studies.filter((study: any) => isVolumeStudy(study));
                if (volumeMatches.length > 0) {
                    for (const duplicate of volumeMatches.slice(1)) {
                        try {
                            chart.removeEntity(duplicate.id);
                        } catch (e) {
                            console.warn('[IndicatorHandler] Failed to remove duplicate volume study', studyNameOf(duplicate), e);
                        }
                    }
                    return;
                }
                chart.createStudy(name, false, false, inputs);
                return;
            }

            const nonVolumeStudies = studies.filter((study: any) => !isVolumeStudy(study));
            const matches = findStudyMatches(nonVolumeStudies, name);

            // If the same indicator already exists, keep one instance and skip duplicate add.
            if (matches.length > 0) {
                for (const duplicate of matches.slice(1)) {
                    try {
                        chart.removeEntity(duplicate.id);
                    } catch (e) {
                        console.warn('[IndicatorHandler] Failed to remove duplicate study', studyNameOf(duplicate), e);
                    }
                }
                return;
            }

            // Enforce UI rule: keep at most 2 non-volume indicators visible.
            const keepBeforeAdd = Math.max(0, MAX_NON_VOLUME_INDICATORS - 1);
            const overflow = nonVolumeStudies.length - keepBeforeAdd;
            if (overflow > 0) {
                for (const staleStudy of nonVolumeStudies.slice(0, overflow)) {
                    try {
                        chart.removeEntity(staleStudy.id);
                    } catch (e) {
                        console.warn('[IndicatorHandler] Failed to remove stale study', studyNameOf(staleStudy), e);
                    }
                }
            }

            // Never force overlay. Let TradingView place the study in its default pane.
            chart.createStudy(name, false, false, inputs);
            return;
        }

        if (action === 'clear_indicators') {
            const keepVolume = Boolean(params?.keep_volume || params?.keepVolume);
            const studies = chart.getAllStudies?.() || [];
            for (const study of studies) {
                const studyName = studyNameOf(study);
                if (keepVolume && isVolumeStudy(study)) {
                    continue;
                }
                try {
                    chart.removeEntity(study.id);
                } catch (e) {
                    console.warn('[IndicatorHandler] Failed to remove study', studyName, e);
                }
            }
            return;
        }

        if (action === 'remove_indicator') {
            const name = String(params?.name || '').trim();
            if (!name) throw new Error('remove_indicator requires name');
            const studies = chart.getAllStudies?.() || [];
            const matches = findStudyMatches(studies, name);
            if (matches.length === 0) {
                throw new Error(`Indicator '${name}' not found`);
            }
            for (const study of matches) {
                chart.removeEntity(study.id);
            }
            return;
        }

        throw new Error(`Unsupported indicator action: ${action}`);
    },
};
