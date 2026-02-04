import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';
import styles from './SearchableSelect.module.css';

const SearchableSelect = ({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    noResultsText = 'No options found',
    disabled = false,
    onSearch = null,  // Async callback for DB search: (searchTerm) => Promise<options[]>
    minSearchLength = 2
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [asyncOptions, setAsyncOptions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Debounced search for async mode
    useEffect(() => {
        if (!onSearch) return;

        if (searchTerm.length < minSearchLength) {
            setAsyncOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await onSearch(searchTerm);
                setAsyncOptions(results);
            } catch (err) {
                console.error('Search error:', err);
                setAsyncOptions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, onSearch, minSearchLength]);

    // Find selected option from both static and async options
    const selectedOption = options.find(opt => opt.value.toString() === value.toString())
        || asyncOptions.find(opt => opt.value.toString() === value.toString());

    // Filter options based on mode (async or static)
    const filteredOptions = onSearch
        ? asyncOptions
        : options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
        if (inputRef.current) inputRef.current.value = ''; // Manual clear
        setAsyncOptions([]);
    };

    const toggleDropdown = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange('');
        setAsyncOptions([]);
        // Don't clear search term on clear selection unless desired
    };

    const [typingTimeout, setTypingTimeout] = useState(null);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        // Don't update state immediately - let the input be native
        if (typingTimeout) clearTimeout(typingTimeout);

        const newTimeout = setTimeout(() => {
            setSearchTerm(value);
        }, 300); // 300ms debounce before state update

        setTypingTimeout(newTimeout);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeout) clearTimeout(typingTimeout);
        };
    }, [typingTimeout]);

    return (
        <div className={styles.container} ref={containerRef}>
            <div
                className={`${styles.selectBox} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
                onClick={toggleDropdown}
            >
                <div className={styles.valueDisplay}>
                    {selectedOption ? (
                        <span className={styles.selectedLabel}>{selectedOption.label}</span>
                    ) : (
                        <span className={styles.placeholder}>{placeholder}</span>
                    )}
                </div>
                <div className={styles.actions}>
                    {value && !disabled && (
                        <X
                            size={16}
                            className={styles.clearIcon}
                            onClick={clearSelection}
                        />
                    )}
                    <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.searchContainer}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder={onSearch ? `Type ${minSearchLength}+ chars to search...` : searchPlaceholder}
                            onChange={handleSearchChange}
                            onClick={(e) => e.stopPropagation()}
                            autoComplete="off"
                            // Remove autoFocus to avoid aggressive re-focusing
                            style={{
                                color: 'var(--color-text-main)',
                                width: '100%',
                                opacity: 1,
                                cursor: 'text',
                                pointerEvents: 'auto'
                            }}
                        />
                        {isSearching && (
                            <Loader2 size={16} className={styles.loadingIcon} />
                        )}
                    </div>
                    <div className={styles.optionsList}>
                        {isSearching ? (
                            <div className={styles.loading}>Searching...</div>
                        ) : onSearch && searchTerm.length < minSearchLength ? (
                            <div className={styles.hint}>Type at least {minSearchLength} characters to search</div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`${styles.option} ${option.value.toString() === value.toString() ? styles.selected : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResults}>{noResultsText}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
