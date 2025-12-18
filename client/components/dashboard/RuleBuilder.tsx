import React, { useState, useEffect } from 'react';
import { TriggerType } from '../../types';
import { TRIGGER_ICONS } from '../../lib/constants';
import { ruleApi, EventPattern, PayloadPattern, Operator } from '../../lib/api/';
import styles from './RuleBuilder.module.css';

interface RuleBuilderProps {
  initialRule?: any; // For future edit functionality
  onSave: (response: { statusCode: number; message: string }) => void;
  onCancel: () => void;
  domainKey: string;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ initialRule, onSave, onCancel, domainKey }) => {
  const [name, setName] = useState(initialRule?.name || '');
  const [trigger, setTrigger] = useState<TriggerType>(initialRule?.trigger || 'click');
  
  // Target Element configuration
  const [targetPattern, setTargetPattern] = useState<number | null>(null);
  const [targetMatchOperator, setTargetMatchOperator] = useState<number>(1);
  const [targetValue, setTargetValue] = useState(initialRule?.selector || '');
  
  // Condition configuration
  const [conditions, setConditions] = useState<Array<{
    pattern: number | null;
    operator: number;
    value: string;
  }>>([{
    pattern: null,
    operator: 1,
    value: ''
  }]);
  
  // Payload extraction configuration
  const [itemPattern, setItemPattern] = useState<number | null>(null);
  const [itemMatchOperator, setItemMatchOperator] = useState<number>(1);
  const [itemValue, setItemValue] = useState<string>('');
  
  const [userPattern, setUserPattern] = useState<number | null>(null);
  const [userMatchOperator, setUserMatchOperator] = useState<number>(1);
  const [userValue, setUserValue] = useState<string>('window.USER_ID');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
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
        
        // Set default pattern IDs after loading
        if (events.length > 0 && targetPattern === null) {
          // Default to first event pattern (CSS Selector)
          setTargetPattern(events[0].Id);
        }
        
        if (payloads.length > 0 && itemPattern === null) {
          // Default to first payload pattern for item
          setItemPattern(payloads[0].Id);
          setUserPattern(payloads[0].Id);
        }
      } catch (error) {
        console.error('Failed to fetch rule options:', error);
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // Add a new condition
  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        pattern: eventPatterns[0]?.Id || null,
        operator: 1,
        value: ''
      }
    ]);
  };

  // Remove a condition
  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Update a specific condition
  const updateCondition = (index: number, field: 'pattern' | 'operator' | 'value', value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value
    };
    setConditions(newConditions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Find trigger event ID from eventPatterns
      const triggerEventId = eventPatterns.find(ep => ep.Name.toLowerCase() === trigger)?.Id || 1;
      
      // Construct CreateRuleDto matching backend
      const createRuleDto = {
        name,
        domainKey: domainKey,
        triggerEventId: triggerEventId,
        targetEventPatternId: targetPattern || null,
        targetOperatorId: targetMatchOperator,
        targetElementValue: targetValue,
        conditions: conditions
          .filter(c => c.value) // Only include conditions with values
          .map(c => ({
            eventPatternId: c.pattern || null,
            operatorId: c.operator,
            value: c.value
          })),
        payloadConfigs: [
          {
            payloadPatternId: itemPattern || null,
            operatorId: itemMatchOperator,
            value: itemValue,
            type: 'itemId'
          },
          {
            payloadPatternId: userPattern || null,
            operatorId: userMatchOperator,
            value: userValue,
            type: 'userId'
          }
        ]
      };

      // POST to API
      const response = await ruleApi.create(createRuleDto);
      
      // Call onSave with API response
      onSave(response);

    } catch (error: any) {
      console.error('Failed to create rule:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to create rule. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error codes
      if (error.response?.status === 409 || error.response?.data?.statusCode === 409) {
        errorMessage = 'A rule with this name already exists. Please use a different name.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Error Message */}
        {submitError && (
          <div className={styles.errorMessage}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}
        
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
              value={targetPattern || ''}
              onChange={e => setTargetPattern(Number(e.target.value))}
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
              value={targetMatchOperator}
              onChange={e => setTargetMatchOperator(Number(e.target.value))}
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
                  <option value="1">Contains</option>
                  <option value="2">Does Not Contain</option>
                  <option value="3">Equals</option>
                  <option value="4">Does Not Equal</option>
                  <option value="5">Starts With</option>
                  <option value="6">Ends With</option>
                  <option value="7">Match Regex</option>
                </>
              )}
            </select>
            <input 
              type="text" 
              className={styles.selectorInput}
              placeholder={
                targetPattern === 'css' ? '.btn-primary or #submit-form' :
                targetPattern === 'dom_path' ? 'body > div > button' :
                targetPattern === 'regex' ? '^/product/.*' :
                '/checkout/*'
              }
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
            />
          </div>
        </div>

        {/* Condition Config */}
        <div className={styles.selectorSection}>
          <div className={styles.conditionHeader}>
            <label className={styles.selectorLabel}>
              Track When
            </label>
            <button 
              type="button" 
              onClick={addCondition}
              className={styles.addButton}
            >
              <span>+</span>
              Add Condition
            </button>
          </div>
          
          {conditions.length === 0 ? (
            <div className={styles.conditionEmptyState}>
              No conditions added. Click "+ Add Condition" to add a condition.
            </div>
          ) : (
            <div className={styles.conditionList}>
              {conditions.map((condition, index) => (
                <div key={index} className={styles.conditionRow}>
                  <div className={styles.selectorInputGroup}>
                    <select 
                      className={styles.selectorMethodSelect}
                      value={condition.pattern || ''}
                      onChange={e => updateCondition(index, 'pattern', Number(e.target.value))}
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
                        <option value="">No patterns available</option>
                      )}
                    </select>
                    <select 
                      className={styles.selectorMethodSelect}
                      value={condition.operator}
                      onChange={e => updateCondition(index, 'operator', Number(e.target.value))}
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
                          <option value="1">Contains</option>
                          <option value="2">Not contains</option>
                          <option value="3">Starts with</option>
                          <option value="4">Ends with</option>
                          <option value="5">Equals</option>
                          <option value="6">Not equals</option>
                          <option value="7">Exists</option>
                          <option value="8">Not exists</option>
                        </>
                      )}
                    </select>
                    <input 
                      type="text" 
                      className={styles.selectorInput}
                      placeholder="URL pattern, CSS selector, or value..."
                      value={condition.value}
                      onChange={e => updateCondition(index, 'value', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className={styles.removeButton}
                    title="Remove condition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payload Mapping */}
        <div className={styles.extractionSection}>
          <h4>
            <span></span>
            Payload Extraction
          </h4>
          <div className={styles.extractionList}>
            <div>
              <label className={styles.selectorLabel}>
                Item ID
              </label>
              <div className={styles.selectorInputGroup}>
                <select 
                  className={styles.selectorMethodSelect}
                  value={itemPattern}
                  onChange={e => setItemPattern(Number(e.target.value))}
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
                  value={itemMatchOperator}
                  onChange={e => setItemMatchOperator(Number(e.target.value))}
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
                      <option value="1">Contains</option>
                      <option value="2">Not contains</option>
                      <option value="3">Starts with</option>
                      <option value="4">Ends with</option>
                      <option value="5">Equals</option>
                      <option value="6">Not equals</option>
                      <option value="7">Exists</option>
                      <option value="8">Not exists</option>
                    </>
                  )}
                </select>
                <input 
                  type="text" 
                  className={styles.selectorInput}
                  placeholder={itemPattern === 'static' ? 'Value...' : itemPattern === 'js_variable' ? 'window.ITEM_ID' : 'Attribute/Selector/Var Name...'}
                  value={itemValue}
                  onChange={e => setItemValue(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={styles.selectorLabel}>
                User ID
              </label>
              <div className={styles.selectorInputGroup}>
                <select 
                  className={styles.selectorMethodSelect}
                  value={userPattern}
                  onChange={e => setUserPattern(Number(e.target.value))}
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
                  value={userMatchOperator}
                  onChange={e => setUserMatchOperator(Number(e.target.value))}
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
                      <option value="1">Contains</option>
                      <option value="2">Not contains</option>
                      <option value="3">Starts with</option>
                      <option value="4">Ends with</option>
                      <option value="5">Equals</option>
                      <option value="6">Not equals</option>
                      <option value="7">Exists</option>
                      <option value="8">Not exists</option>
                    </>
                  )}
                </select>
                <input 
                  type="text" 
                  className={styles.selectorInput}
                  placeholder={userPattern === 'static' ? 'Value...' : userPattern === 'js_variable' ? 'window.USER_ID' : 'Attribute/Selector/Var Name...'}
                  value={userValue}
                  onChange={e => setUserValue(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
            <button
                type="button"
                onClick={onCancel}
                className={styles.cancelButton}
                disabled={isSubmitting}
            >
                Cancel
            </button>
            <button
                type="submit"
                className={styles.saveButton}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </button>
        </div>
      </form>
    </div>
  );
};
