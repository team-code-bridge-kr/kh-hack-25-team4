 (function () {
            const planForm = document.getElementById('planForm');
            const savedPlansDiv = document.getElementById('savedPlans');
            const tabButtons = document.querySelectorAll('.tab-btn');
            const manualSection = document.getElementById('manualSection');
            const aiSection = document.getElementById('aiSection');
            const generateBtn = document.getElementById('generateBtn');
            const loading = document.getElementById('loading');
            
            const GEMINI_API_KEY = 'AIzaSyA7txTfUTtTA7cIF87216PA9cG7qBvreLs';
            let plans = [];
            let currentTab = 'manual';

            tabButtons.forEach((button) => {
                button.addEventListener('click', () => switchTab(button.dataset.tab));
            });

            planForm.addEventListener('submit', (event) => {
                event.preventDefault();

                if (currentTab !== 'manual') {
                    return;
                }

                const subjectInput = document.getElementById('subject');
                const contentInput = document.getElementById('content');
                const subject = subjectInput.value.trim();
                const content = contentInput.value.trim();

                if (!subject || !content) {
                    return;
                }

                plans.unshift({
                    id: Date.now(),
                    subject,
                    content,
                    type: 'manual',
                    createdAt: new Date().toISOString()
                });

                subjectInput.value = '';
                contentInput.value = '';
                displayPlans();
            });

            generateBtn.addEventListener('click', generateAIPlan);

            function switchTab(tab) {
                currentTab = tab;

                tabButtons.forEach((button) => {
                    button.classList.toggle('active', button.dataset.tab === tab);
                });

                manualSection.classList.toggle('active', tab === 'manual');
                aiSection.classList.toggle('active', tab === 'ai');
            }

            async function generateAIPlan() {
                const genaiNamespace = window.google && window.google.generativeai;
                if (!genaiNamespace || !genaiNamespace.GoogleGenerativeAI) {
                    alert('Gemini SDK를 불러오지 못했습니다. 네트워크를 확인한 뒤 페이지를 새로고침해주세요.');
                    return;
                }

                const subject = document.getElementById('aiSubject').value.trim();
                const level = document.getElementById('studyLevel').value;
                const studyTime = document.getElementById('studyTime').value.trim();
                const goal = document.getElementById('studyGoal').value.trim();

                if (!subject || !level || !studyTime) {
                    alert('과목, 학습 수준, 하루 학습 가능 시간을 모두 입력해주세요.');
                    return;
                }

                loading.classList.add('active');
                generateBtn.disabled = true;

                const prompt = `당신은 개인 맞춤형 학습 플래너입니다. 아래 조건에 맞춰 한국어로 체계적인 주간 학습 계획을 제안해주세요.\n\n` +
                    `- **과목**: ${subject}\n` +
                    `- **수준**: ${level}\n` +
                    `- **하루 학습 가능 시간**: ${studyTime}\n` +
                    (goal ? `- **구체적인 목표/시험**: ${goal}\n\n` : '\n') +
                    `계획은 Markdown 표 형식으로 작성하고, 하루 단위 세부 학습 내용과 시간을 명시해주세요.\n` +
                    `마지막에는 동기 부여가 되는 짧은 총평을 포함해주세요.`;

                try {
                    const { GoogleGenerativeAI } = genaiNamespace;
                    if (!GoogleGenerativeAI) {
                        throw new Error('GoogleGenerativeAI 클래스를 찾을 수 없습니다. SDK 버전을 확인하세요.');
                    }

                    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
                    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const response = await model.generateContent([{ text: prompt }]);
                    const aiPlan = response.response.text().trim();

                    if (!aiPlan) {
                        throw new Error('빈 응답이 반환되었습니다.');
                    }

                    plans.unshift({
                        id: Date.now(),
                        subject: `${subject} (AI 추천)`,
                        content: aiPlan,
                        type: 'ai',
                        createdAt: new Date().toISOString()
                    });

                    document.getElementById('aiSubject').value = '';
                    document.getElementById('studyLevel').value = '';
                    document.getElementById('studyTime').value = '';
                    document.getElementById('studyGoal').value = '';

                    displayPlans();
                } catch (error) {
                    console.error('AI 생성 오류:', error);
                    alert(`AI 계획 생성 중 문제가 발생했습니다: ${error.message}`);
                } finally {
                    loading.classList.remove('active');
                    generateBtn.disabled = false;
                }
            }

            function displayPlans() {
                savedPlansDiv.innerHTML = '';

                if (plans.length === 0) {
                    const empty = document.createElement('p');
                    empty.style.color = 'rgba(255, 255, 255, 0.85)';
                    empty.style.textAlign = 'center';
                    empty.textContent = '저장된 학습 계획이 아직 없어요. 직접 작성하거나 Gemini에게 부탁해보세요!';
                    savedPlansDiv.appendChild(empty);
                    return;
                }

                plans.forEach((plan) => {
                    const item = document.createElement('div');
                    item.className = 'plan-item';

                    const badge = document.createElement('span');
                    badge.className = 'plan-badge';
                    badge.textContent = plan.type === 'ai' ? '🤖 AI' : '✍️ 직접';

                    const subject = document.createElement('div');
                    subject.className = 'plan-subject';
                    subject.textContent = `📚 ${plan.subject}`;

                    const content = document.createElement('div');
                    content.className = 'plan-content';
                    content.textContent = plan.content;

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.type = 'button';
                    deleteBtn.textContent = '삭제';
                    deleteBtn.addEventListener('click', () => {
                        plans = plans.filter((storedPlan) => storedPlan.id !== plan.id);
                        displayPlans();
                    });

                    item.appendChild(badge);
                    item.appendChild(subject);
                    item.appendChild(content);
                    item.appendChild(deleteBtn);

                    savedPlansDiv.appendChild(item);
                });
            }

            switchTab('manual');
            displayPlans();
        })();