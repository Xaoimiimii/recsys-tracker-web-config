import React, { useState, useEffect } from 'react';
import { TrackingRule, TriggerType, DataExtractionRule } from '../../types';
import { TRIGGER_ICONS } from '../../lib/constants';
import { ruleApi, EventPattern, PayloadPattern, Operator } from '../../lib/api/';
import styles from './RuleBuilder.module.css';

interface RuleBuilderProps {
  initialRule?: TrackingRule;
  onSave: (rule: TrackingRule) => void;
  onCancel: () => void;
  domainKey: string;
}

const DEFAULT_EXTRACTION: DataExtractionRule[] = [
  { field: 'itemId', method: 'static', value: '' },
  { field: 'userId', method: 'js_variable', value: 'window.USER_ID' },
];

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ initialRule, onSave, onCancel }) => {
  const [name, setName] = useState(initialRule?.name || '');
  const [trigger, setTrigger] = useState<TriggerType>(initialRule?.trigger || 'click');
  const [selector, setSelector] = useState(initialRule?.selector || '');
  const [selectorMethod, setSelectorMethod] = useState<string>('css');
  const [conditionType, setConditionType] = useState<string>('match');
  const [conditionValue, setConditionValue] = useState<string>('');
  const [extraction, setExtraction] = useState<DataExtractionRule[]>(initialRule?.extraction || DEFAULT_EXTRACTION);
  
  // API data states
  const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([]);
  const [payloadPatterns, setPayloadPatterns] = useState<PayloadPattern[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Fetch dropdown options from API
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [events, payloads, ops] = await Promise.all([
          ruleApi.getEventPatterns(),
          ruleApi.getPayloadPatterns(),
          ruleApi.getOperators(),
        ]);
        
        setEventPatterns(events);
        setPayloadPatterns(payloads);
        setOperators(ops);
      } catch (error) {
        console.error('Failed to fetch rule options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const updateExtraction = (index: number, field: keyof DataExtractionRule, value: string) => {
    const newExt = [...extraction];
    newExt[index][field] = value;
    setExtraction(newExt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialRule?.id || Math.random().toString(36).substr(2, 9),
      name,
      trigger,
      selector,
      extraction
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{initialRule ? 'Edit Rule' : 'New Tracking Rule'}</h3>
        <button onClick={onCancel} className={styles.closeButton}>
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Info */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Rule Name</label>
            <input 
              type="text" 
              required
              className={styles.input}
              placeholder="e.g., Track Play Button"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Trigger Event</label>
            <div className={styles.selectContainer}>
                <select 
                className={styles.select}
                value={trigger}
                onChange={e => setTrigger(e.target.value as TriggerType)}
                >
                  <option value="click">Click</option>
                  <option value="form_submit">Form Submission</option>
                  <option value="scroll">Scroll</option>
                  <option value="view">Page view</option>
                </select>
                <div className={styles.selectIcon}>
                    {React.createElement(TRIGGER_ICONS[trigger], { size: 18 })}
                </div>
            </div>
          </div>
        </div>

        {/* Selector Config */}
        <div className={styles.selectorSection}>
          <label className={styles.selectorLabel}>
            Target Element
          </label>
          <div className={styles.selectorInputGroup}>
            <select 
              className={styles.selectorMethodSelect}
              value={selectorMethod}
              onChange={e => setSelectorMethod(e.target.value)}
              disabled={isLoadingOptions}
            >
              {isLoadingOptions ? (
                <option>Loading...</option>
              ) : eventPatterns.length > 0 ? (
                eventPatterns.map(pattern => (
                  <option key={pattern.Id} value={pattern.Id}>
                    {pattern.Name}
                  </option>
                ))
              ) : (
                <>
                  <option value="css">CSS Selector</option>
                  <option value="regex">Regex Selector</option>
                </>
              )}
            </select>
            <select 
              className={styles.selectorMethodSelect}
              value="contains"
              disabled={isLoadingOptions}
            >
              {isLoadingOptions ? (
                <option>Loading operators...</option>
              ) : operators.length > 0 ? (
                operators.map(op => (
                  <option key={op.Id} value={op.Id}>
                    {op.Name}
                  </option>
                ))
              ) : (
                <>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Does Not Contain</option>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Does Not Equal</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                  <option value="match_regex">Match Regex</option>
                </>
              )}
            </select>
            <input 
              type="text" 
              className={styles.selectorInput}
              placeholder={
                selectorMethod === 'css' ? '.btn-primary or #submit-form' :
                selectorMethod === 'dom_path' ? 'body > div > button' :
                selectorMethod === 'regex' ? '^/product/.*' :
                '/checkout/*'
              }
              value={selector}
              onChange={e => setSelector(e.target.value)}
            />
          </div>
        </div>

        {/* Condition Config */}
        <div className={styles.selectorSection}>
          <label className={styles.selectorLabel}>
            Track When
          </label>
          <div className={styles.selectorInputGroup}>
            <select 
              className={styles.selectorMethodSelect}
              value="url"
            >
              <option value="url">URL Pattern</option>
              <option value="css">CSS Selector</option>
              <option value="dom_path">DOM Path</option>
              <option value="custom">Custom Condition</option>
            </select>
            <select 
              className={styles.selectorMethodSelect}
              value={conditionType}
              onChange={e => setConditionType(e.target.value)}
              disabled={isLoadingOptions}
            >
              {isLoadingOptions ? (
                <option>Loading operators...</option>
              ) : operators.length > 0 ? (
                operators.map(op => (
                  <option key={op.Id} value={op.Id}>
                    {op.Name}
                  </option>
                ))
              ) : (
                <>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Does Not Contain</option>
                  <option value="equals">Equals</option>
                  <option value="not_equals">Does Not Equal</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                  <option value="match_regex">Match Regex</option>
                </>
              )}
            </select>
            <input 
              type="text" 
              className={styles.selectorInput}
              placeholder="URL pattern, CSS selector, or value..."
              value={conditionValue}
              onChange={e => setConditionValue(e.target.value)}
            />
          </div>
        </div>

        {/* Payload Mapping */}
        <div className={styles.extractionSection}>
          <h4>
            <span></span>
            Payload Extraction
          </h4>
          <div className={styles.extractionList}>
            {extraction.map((rule, idx) => (
              <div key={idx} className={styles.extractionRow}>
                <label className={styles.selectorLabel}>
                  {rule.field === 'itemId' ? 'Item ID' : rule.field === 'userId' ? 'User ID' : rule.field}
                </label>
                <div className={styles.selectorInputGroup}>
                  <select 
                    className={styles.selectorMethodSelect}
                    value={rule.method}
                    onChange={e => updateExtraction(idx, 'method', e.target.value)}
                    disabled={isLoadingOptions}
                  >
                    {isLoadingOptions ? (
                      <option>Loading patterns...</option>
                    ) : payloadPatterns.length > 0 ? (
                      payloadPatterns.map(pattern => (
                        <option key={pattern.Id} value={pattern.Id}>
                          {pattern.Name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="css_attribute">CSS Selector</option>
                        <option value="dom_path">DOM Path</option>
                        <option value="url_param">URL Param</option>
                        <option value="js_variable">JS Variable</option>
                        <option value="inner_text">Inner Text</option>
                        <option value="static">Static Value</option>
                      </>
                    )}
                  </select>
                  <select 
                    className={styles.selectorMethodSelect}
                    value="contains"
                    disabled={isLoadingOptions}
                  >
                    {isLoadingOptions ? (
                      <option>Loading operators...</option>
                    ) : operators.length > 0 ? (
                      operators.map(op => (
                        <option key={op.Id} value={op.Id}>
                          {op.Name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="contains">Contains</option>
                        <option value="not_contains">Does Not Contain</option>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Does Not Equal</option>
                        <option value="starts_with">Starts With</option>
                        <option value="ends_with">Ends With</option>
                        <option value="match_regex">Match Regex</option>
                      </>
                    )}
                  </select>
                  <input 
                    type="text" 
                    className={styles.selectorInput}
                    placeholder={rule.method === 'static' ? 'Value...' : rule.method === 'js_variable' ? 'window.USER_ID' : 'Attribute/Selector/Var Name...'}
                    value={rule.value}
                    onChange={e => updateExtraction(idx, 'value', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
            <button
                type="button"
                onClick={onCancel}
                className={styles.cancelButton}
            >
                Cancel
            </button>
            <button
                type="submit"
                className={styles.saveButton}
            >
                Save Configuration
            </button>
        </div>
      </form>
    </div>
  );
};
