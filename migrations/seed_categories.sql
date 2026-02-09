-- =====================================================
-- SEED CATEGORII STANDARD pentru Vibe Budget
-- =====================================================
--
-- SCOP:
-- Acest script populează cele 12 categorii standard pentru utilizator.
-- Categoriile trebuie să existe pentru ca auto-categorizarea să funcționeze.
--
-- RULARE:
-- Execută în Supabase SQL Editor sau prin supabase db execute
-- =====================================================

-- IMPORTANT: Înlocuiește USER_EMAIL cu emailul tău real
DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- Obținem ID-ul utilizatorului pe baza emailului (ca TEXT pentru compatibilitate)
    SELECT id::TEXT INTO v_user_id
    FROM users
    WHERE email = 'danmitrut@gmail.com'; -- SCHIMBĂ CU EMAILUL TĂU

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilizatorul cu emailul specificat nu a fost găsit!';
    END IF;

    RAISE NOTICE 'User ID găsit: %', v_user_id;

    -- Ștergem categoriile existente pentru a evita duplicate
    DELETE FROM categories WHERE user_id = v_user_id::TEXT;
    RAISE NOTICE 'Categorii vechi șterse';

    -- Inserăm cele 12 categorii standard CU CULORI DISTINCTIVE
    INSERT INTO categories (user_id, name, icon, description, color, created_at, updated_at)
    VALUES
        -- 1. Transport (Albastru)
        (
            v_user_id,
            'Transport',
            '🚗',
            'Transport în comun sau cheltuieli cu mijlocul personal de transport (benzină, service auto, taxi, Uber)',
            '#3b82f6',
            NOW(),
            NOW()
        ),

        -- 2. Cumpărături (Verde)
        (
            v_user_id,
            'Cumpărături',
            '🛍️',
            'Tot ce ține de market, supermarket și cumpărături online (haine, electronice, mobilă)',
            '#22c55e',
            NOW(),
            NOW()
        ),

        -- 3. Locuință (Portocaliu)
        (
            v_user_id,
            'Locuință',
            '🏠',
            'Cheltuieli de utilități, chirii, rate imobiliare, renovări, mobilări',
            '#f97316',
            NOW(),
            NOW()
        ),

        -- 4. Sănătate (Roșu)
        (
            v_user_id,
            'Sănătate',
            '🏥',
            'Medicamente, investigații, consultații, intervenții medicale',
            '#ef4444',
            NOW(),
            NOW()
        ),

        -- 5. Divertisment (Roz)
        (
            v_user_id,
            'Divertisment',
            '🍽️',
            'Restaurante, cafenele, baruri, cinema, evenimente, ieșiri în oraș',
            '#ec4899',
            NOW(),
            NOW()
        ),

        -- 6. Subscripții (Violet)
        (
            v_user_id,
            'Subscripții',
            '📺',
            'Abonamente pentru streaming, software, servicii cloud, fitness',
            '#8b5cf6',
            NOW(),
            NOW()
        ),

        -- 7. Educație (Indigo)
        (
            v_user_id,
            'Educație',
            '📚',
            'Școală, universitate, cărți, cursuri online, training-uri',
            '#6366f1',
            NOW(),
            NOW()
        ),

        -- 8. Venituri (Emerald)
        (
            v_user_id,
            'Venituri',
            '💰',
            'Salarii, freelance, dividende, bonusuri, venituri din diverse surse',
            '#10b981',
            NOW(),
            NOW()
        ),

        -- 9. Transfer Intern (Cyan)
        (
            v_user_id,
            'Transfer Intern',
            '🔄',
            'Transferuri între propriile conturi (nu afectează bugetul total)',
            '#06b6d4',
            NOW(),
            NOW()
        ),

        -- 10. Transferuri (Teal)
        (
            v_user_id,
            'Transferuri',
            '💸',
            'Transferuri către/de la prieteni, familie sau servicii de transfer',
            '#14b8a6',
            NOW(),
            NOW()
        ),

        -- 11. Taxe și Impozite (Gri)
        (
            v_user_id,
            'Taxe și Impozite',
            '🧾',
            'Taxe, impozite, amenzi, penalități',
            '#6b7280',
            NOW(),
            NOW()
        ),

        -- 12. Cash (Amber)
        (
            v_user_id,
            'Cash',
            '💵',
            'Retrageri de numerar de la ATM',
            '#f59e0b',
            NOW(),
            NOW()
        );

    RAISE NOTICE '✅ 12 categorii standard create cu succes!';

END $$;

-- Verificare finală
SELECT
    c.name as "Categorie",
    c.icon as "Icon",
    u.email as "Utilizator"
FROM categories c
JOIN users u ON c.user_id = u.id
WHERE u.email = 'danmitrut@gmail.com'
ORDER BY c.name;
